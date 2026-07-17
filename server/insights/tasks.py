import logging
from celery import shared_task
from accounts.models import User
from audits.models import AuditEvent
from documents.models import Document
from documents.tasks import _emit_audit_event
from insights.services.draft_generator import generate_draft

logger = logging.getLogger("InsightsTask")


@shared_task(bind=True, max_retries=2, default_retry_delay=15)
def generate_contract_draft_task(
    self, document_id: str, user_id: str, draft_type: str, custom_instructions: str = None
):
    try:
        document = Document.objects.get(id=document_id)
        user = User.objects.get(id=user_id)
    except (Document.DoesNotExist, User.DoesNotExist) as exc:
        logger.error("Draft generation aborted: document or user missing: %s", exc)
        return

    try:
        draft = generate_draft(
            document=document,
            user=user,
            draft_type=draft_type,
            custom_instructions=custom_instructions,
        )
        _emit_audit_event(
            document,
            AuditEvent.EventType.DRAFT_GENERATED,
            {
                "draft_id": str(draft.id),
                "draft_type": draft.draft_type,
                "requested_by": str(user.id),
            },
        )
        return str(draft.id)
    except Exception as exc:
        logger.exception("Failed to generate contract draft for document %s: %s", document_id, exc)
        try:
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error("Max retries exceeded for generate_contract_draft_task: %s", exc)
