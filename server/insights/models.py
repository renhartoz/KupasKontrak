import uuid
from django.db import models


class ContractVisualization(models.Model):
    class ScenarioType(models.TextChoices):
        FINANCIAL_LOSS = "financial_loss"
        CLAUSE_IMPACT = "clause_impact"
        BEFORE_AFTER = "before_after"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        "documents.Document", on_delete=models.CASCADE, related_name="visualizations"
    )
    clause = models.ForeignKey(
        "audits.ClauseFinding",
        on_delete=models.CASCADE,
        null=True,
        related_name="visualizations",
    )
    scenario_type = models.CharField(max_length=16, choices=ScenarioType.choices)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class ActionRecommendation(models.Model):
    class ActionType(models.TextChoices):
        NEGOTIATE = "negotiate"
        REJECT = "reject"
        REQUEST_CLARIFICATION = "request_clarification"
        ACCEPT_WITH_CONDITION = "accept_with_condition"
        SEEK_LEGAL_AID = "seek_legal_aid"

    class Priority(models.TextChoices):
        TINGGI = "tinggi"
        SEDANG = "sedang"
        RENDAH = "rendah"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        "documents.Document", on_delete=models.CASCADE, related_name="recommendations"
    )
    clause = models.ForeignKey(
        "audits.ClauseFinding",
        on_delete=models.CASCADE,
        null=True,
        related_name="recommendations",
    )
    action_type = models.CharField(max_length=24, choices=ActionType.choices)
    priority = models.CharField(max_length=8, choices=Priority.choices)
    recommendation_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class GeneratedContractDraft(models.Model):
    class DraftType(models.TextChoices):
        FULL_REWRITE = "full_rewrite"
        CLAUSE_PATCH = "clause_patch"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        "documents.Document", on_delete=models.CASCADE, related_name="drafts"
    )
    requested_by = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    draft_type = models.CharField(max_length=16, choices=DraftType.choices)
    content = models.JSONField()
    disclaimer = models.TextField(
        default=(
            "Draf ini dihasilkan otomatis oleh AI sebagai bahan negosiasi awal dan BUKAN "
            "pengganti nasihat hukum profesional. Konsultasikan dengan advokat sebelum "
            "menandatangani kontrak final."
        )
    )
    created_at = models.DateTimeField(auto_now_add=True)
