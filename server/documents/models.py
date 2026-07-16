import uuid
from django.db import models


class Document(models.Model):
    class SourceType(models.TextChoices):
        NATIVE = "native", "Native PDF"
        SCANNED = "scanned", "Scanned PDF"

    class Status(models.TextChoices):
        UPLOADED = "uploaded"
        EXTRACTING = "extracting"
        ANALYZING = "analyzing"
        VALIDATING_MCP = "validating_mcp"
        GENERATING_INSIGHTS = "generating_insights"
        DONE = "done"
        FAILED = "failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="documents"
    )
    cloudinary_public_id = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    source_type = models.CharField(max_length=16, choices=SourceType.choices, null=True)
    page_count = models.PositiveIntegerField(null=True)
    file_size_bytes = models.PositiveIntegerField()
    status = models.CharField(
        max_length=24, choices=Status.choices, default=Status.UPLOADED
    )
    overall_risk_score = models.FloatField(null=True)
    score_breakdown = models.JSONField(null=True)
    failure_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["owner", "status"])]
