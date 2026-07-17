from rest_framework import serializers
from insights.models import (
    ActionRecommendation,
    ContractVisualization,
    GeneratedContractDraft,
)


class ContractVisualizationSerializer(serializers.ModelSerializer):
    """Visualization details"""

    class Meta:
        model = ContractVisualization
        fields = [
            "id",
            "document",
            "clause",
            "scenario_type",
            "data",
            "created_at",
        ]


class ActionRecommendationSerializer(serializers.ModelSerializer):
    """Recommendation details"""

    class Meta:
        model = ActionRecommendation
        fields = [
            "id",
            "document",
            "clause",
            "action_type",
            "priority",
            "recommendation_text",
            "created_at",
        ]


class GeneratedContractDraftSerializer(serializers.ModelSerializer):
    """Draft details"""

    class Meta:
        model = GeneratedContractDraft
        fields = [
            "id",
            "document",
            "requested_by",
            "draft_type",
            "content",
            "disclaimer",
            "created_at",
        ]


class DraftCreateSerializer(serializers.Serializer):
    """Create draft"""

    draft_type = serializers.ChoiceField(
        choices=GeneratedContractDraft.DraftType.choices
    )
    custom_instructions = serializers.CharField(required=False, allow_blank=True)
