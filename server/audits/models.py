import uuid
from django.db import models


class AuditEvent(models.Model):
    class EventType(models.TextChoices):
        EXTRACTION_STARTED = "extraction_started"
        EXTRACTION_DONE = "extraction_done"
        CLAUSE_FLAGGED = "clause_flagged"
        MCP_VALIDATED = "mcp_validated"
        MCP_VALIDATION_FAILED = "mcp_validation_failed"
        SCORE_COMPUTED = "score_computed"
        VISUALIZATION_GENERATED = "visualization_generated"
        RECOMMENDATION_GENERATED = "recommendation_generated"
        DRAFT_GENERATED = "draft_generated"
        AUDIT_COMPLETED = "audit_completed"
        AUDIT_FAILED = "audit_failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        "documents.Document", on_delete=models.CASCADE, related_name="events"
    )
    event_type = models.CharField(max_length=32, choices=EventType.choices)
    payload = models.JSONField()
    sequence_number = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document", "sequence_number"], name="unique_seq_per_doc"
            )
        ]
        ordering = ["document", "sequence_number"]


class ClauseFinding(models.Model):
    class RiskLevel(models.TextChoices):
        HIJAU_TUA = "hijau_tua"
        HIJAU_MUDA = "hijau_muda"
        KUNING = "kuning"
        MERAH_MUDA = "merah_muda"
        MERAH_TUA = "merah_tua"

    id = models.CharField(max_length=16, primary_key=True)
    document = models.ForeignKey(
        "documents.Document", on_delete=models.CASCADE, related_name="clauses"
    )
    clause_text = models.TextField()
    clause_safety_score = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)], default=3
    )
    category = models.CharField(max_length=64, default="default")
    risk_level = models.CharField(max_length=16, choices=RiskLevel.choices)
    plain_language_summary = models.TextField()
    legal_reference = models.JSONField(null=True)
    order_index = models.PositiveIntegerField()

    class Meta:
        ordering = ["order_index"]
