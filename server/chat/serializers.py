from rest_framework import serializers
from chat.models import ClauseInquiry, DocumentInquiry


class ClauseInquirySerializer(serializers.ModelSerializer):
    """Inquiry details"""

    class Meta:
        model = ClauseInquiry
        fields = ["id", "clause", "user", "question", "answer", "created_at"]
        read_only_fields = ["id", "clause", "user", "answer", "created_at"]


class ClauseAskSerializer(serializers.Serializer):
    """Ask question"""

    question = serializers.CharField(required=True, min_length=3)


class DocumentInquirySerializer(serializers.ModelSerializer):
    """Document Inquiry details"""

    class Meta:
        model = DocumentInquiry
        fields = ["id", "document", "user", "question", "answer", "created_at"]
        read_only_fields = ["id", "document", "user", "answer", "created_at"]


class DocumentAskSerializer(serializers.Serializer):
    """Ask document question"""

    question = serializers.CharField(required=True, min_length=3)
