from rest_framework import serializers
from documents.cloudinary_service import generate_signed_url
from documents.models import Document


class DocumentUploadSerializer(serializers.Serializer):
    """Upload document"""

    file = serializers.FileField(required=True)

    def validate_file(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("File format must be PDF.")
        if value.size > 25 * 1024 * 1024:
            raise serializers.ValidationError("File size exceeds 25 MB limit.")
        return value


class DocumentListSerializer(serializers.ModelSerializer):
    """List documents"""

    class Meta:
        model = Document
        fields = [
            "id",
            "original_filename",
            "status",
            "overall_risk_score",
            "source_type",
            "created_at",
        ]


class DocumentDetailSerializer(serializers.ModelSerializer):
    """Document details"""

    signed_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "original_filename",
            "status",
            "source_type",
            "page_count",
            "file_size_bytes",
            "overall_risk_score",
            "score_breakdown",
            "failure_reason",
            "signed_pdf_url",
            "created_at",
            "updated_at",
        ]

    def get_signed_pdf_url(self, obj) -> str:
        try:
            url, _ = generate_signed_url(obj.cloudinary_public_id, ttl_seconds=3600)
            return url
        except Exception:
            return ""


class DocumentExportSerializer(serializers.Serializer):
    """Export document"""

    format = serializers.ChoiceField(choices=["pdf", "docx"], default="pdf")
