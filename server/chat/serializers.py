from rest_framework import serializers
from chat.models import ClauseInquiry


class ClauseInquirySerializer(serializers.ModelSerializer):
    """Inquiry details"""

    class Meta:
        model = ClauseInquiry
        fields = ["id", "clause", "user", "question", "answer", "created_at"]
        read_only_fields = ["id", "clause", "user", "answer", "created_at"]


class ClauseAskSerializer(serializers.Serializer):
    """Ask question"""

    question = serializers.CharField(required=True, min_length=3)
