import logging
from celery import shared_task
from django.db import transaction
from audits.models import AuditEvent, ClauseFinding
from documents.models import Document
from documents.services.extraction import extract, OcrExtractionError
from documents.services.llm_gateway import analyze_contract, AllModelsFailedError
from documents.services.mcp_client import MCPClient, MCPValidationError
from insights.services.recommendation_generator import generate_recommendations
from insights.services.scoring import compute_document_score
from insights.services.visualization_generator import generate_visualizations

logger = logging.getLogger("DocumentProcessingTask")


def _emit_audit_event(document, event_type: str, payload: dict) -> AuditEvent:
    with transaction.atomic():
        doc_locked = Document.objects.select_for_update().get(id=document.id)
        last_event = (
            AuditEvent.objects.filter(document=doc_locked)
            .order_by("-sequence_number")
            .first()
        )
        next_seq = (last_event.sequence_number + 1) if last_event else 1
        event = AuditEvent.objects.create(
            document=doc_locked,
            event_type=event_type,
            payload=payload,
            sequence_number=next_seq,
        )
    return event


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_document(self, document_id: str):
    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        logger.error("Document with id %s does not exist.", document_id)
        return

    try:
        document.status = Document.Status.EXTRACTING
        document.save(update_fields=["status", "updated_at"])
        _emit_audit_event(
            document,
            AuditEvent.EventType.EXTRACTION_STARTED,
            {"message": "Mulai ekstraksi teks dari dokumen PDF..."},
        )

        extracted_text = extract(document)
        if not extracted_text:
            raise OcrExtractionError("Gagal mengekstrak teks: hasil ekstraksi kosong.")

        _emit_audit_event(
            document,
            AuditEvent.EventType.EXTRACTION_DONE,
            {
                "source_type": document.source_type,
                "character_count": len(extracted_text),
            },
        )

        document.status = Document.Status.ANALYZING
        document.save(update_fields=["status", "updated_at"])

        analysis_result = analyze_contract(extracted_text)

        ClauseFinding.objects.filter(document=document).delete()
        saved_clauses = []
        for idx, item in enumerate(analysis_result.clauses):
            finding = ClauseFinding.objects.create(
                id=item.id,
                document=document,
                clause_text=item.clause_text,
                clause_safety_score=item.clause_safety_score,
                category=item.category,
                risk_level=item.risk_level,
                plain_language_summary=item.plain_language_summary,
                mcp_query_hint=item.mcp_query_hint,
                order_index=idx,
            )
            saved_clauses.append(finding)
            if item.is_flagged:
                _emit_audit_event(
                    document,
                    AuditEvent.EventType.CLAUSE_FLAGGED,
                    item.to_event_payload(),
                )

        document.status = Document.Status.VALIDATING_MCP
        document.save(update_fields=["status", "updated_at"])

        mcp_client = MCPClient()
        flagged_findings = [
            f for f in saved_clauses if f.clause_safety_score <= 3
        ]
        for finding in flagged_findings:
            try:
                ref_data = mcp_client.validate_clause(finding)
                finding.legal_reference = ref_data
                finding.save(update_fields=["legal_reference"])
                _emit_audit_event(
                    document,
                    AuditEvent.EventType.MCP_VALIDATED,
                    {"clause_id": finding.id, "reference": ref_data},
                )
            except MCPValidationError as exc:
                _emit_audit_event(
                    document,
                    AuditEvent.EventType.MCP_VALIDATION_FAILED,
                    {"clause_id": finding.id, "reason": str(exc)},
                )
            except Exception as exc:
                logger.error("Unexpected MCP validation error for %s: %s", finding.id, exc)
                _emit_audit_event(
                    document,
                    AuditEvent.EventType.MCP_VALIDATION_FAILED,
                    {"clause_id": finding.id, "reason": f"Unexpected error: {exc}"},
                )

        document.status = Document.Status.GENERATING_INSIGHTS
        document.save(update_fields=["status", "updated_at"])

        score, breakdown, fatal_count = compute_document_score(document)
        document.overall_risk_score = score
        document.score_breakdown = breakdown
        document.save(update_fields=["overall_risk_score", "score_breakdown", "updated_at"])

        _emit_audit_event(
            document,
            AuditEvent.EventType.SCORE_COMPUTED,
            {
                "overall_risk_score": score,
                "score_breakdown": breakdown,
                "fatal_clauses_count": fatal_count,
            },
        )

        visualizations = generate_visualizations(document)
        _emit_audit_event(
            document,
            AuditEvent.EventType.VISUALIZATION_GENERATED,
            {"visualizations_count": len(visualizations)},
        )

        recommendations = generate_recommendations(document)
        _emit_audit_event(
            document,
            AuditEvent.EventType.RECOMMENDATION_GENERATED,
            {"recommendations_count": len(recommendations)},
        )

        document.status = Document.Status.DONE
        document.failure_reason = ""
        document.save(update_fields=["status", "failure_reason", "updated_at"])

        _emit_audit_event(
            document,
            AuditEvent.EventType.AUDIT_COMPLETED,
            {
                "overall_risk_score": score,
                "total_clauses": len(saved_clauses),
                "summary": analysis_result.summary,
            },
        )

    except (OcrExtractionError, AllModelsFailedError) as exc:
        logger.error("Processing error for document %s: %s", document_id, exc)
        _handle_failure(document, str(exc))
    except Exception as exc:
        logger.exception("Fatal processing error for document %s: %s", document_id, exc)
        try:
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            _handle_failure(document, f"Max retries exceeded: {exc}")


def _handle_failure(document, reason: str):
    document.status = Document.Status.FAILED
    document.failure_reason = reason
    document.save(update_fields=["status", "failure_reason", "updated_at"])
    _emit_audit_event(
        document,
        AuditEvent.EventType.AUDIT_FAILED,
        {"error": reason},
    )
