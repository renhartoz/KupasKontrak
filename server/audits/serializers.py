from rest_framework import serializers
from audits.models import AuditEvent, ClauseFinding


class ClauseFindingSerializer(serializers.ModelSerializer):
    """Clause finding details"""

    class Meta:
        model = ClauseFinding
        fields = [
            "id",
            "document",
            "clause_text",
            "clause_safety_score",
            "category",
            "risk_level",
            "plain_language_summary",
            "legal_reference",
            "order_index",
        ]


class AuditEventSerializer(serializers.ModelSerializer):
    """Audit event details"""

    class Meta:
        model = AuditEvent
        fields = [
            "id",
            "document",
            "event_type",
            "payload",
            "sequence_number",
            "created_at",
        ]
