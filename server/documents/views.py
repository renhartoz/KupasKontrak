from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.pagination import StandardPageNumberPagination
from core.permissions import IsDocumentOwner, IsTierB2B
from documents.cloudinary_service import generate_signed_url, upload_document
from documents.models import Document
from documents.serializers import (
    DocumentDetailSerializer,
    DocumentExportSerializer,
    DocumentListSerializer,
    DocumentUploadSerializer,
)
from documents.tasks import process_document


class DocumentUploadView(APIView):
    """Upload PDF"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Upload document", request=DocumentUploadSerializer, responses={201: DocumentDetailSerializer})
    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data["file"]

        upload_result = upload_document(file_obj)
        doc = Document.objects.create(
            owner=request.user,
            original_filename=file_obj.name,
            file_size_bytes=file_obj.size,
            cloudinary_public_id=upload_result["public_id"],
            status=Document.Status.UPLOADED,
        )
        process_document.delay(str(doc.id))
        return Response(DocumentDetailSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentListView(APIView):
    """List documents"""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPageNumberPagination

    @extend_schema(summary="List documents", responses={200: DocumentListSerializer(many=True)})
    def get(self, request):
        queryset = Document.objects.filter(owner=request.user).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(DocumentListSerializer(page, many=True).data)
        return Response(DocumentListSerializer(queryset, many=True).data)


class DocumentDetailView(APIView):
    """Retrieve document"""

    permission_classes = [IsAuthenticated, IsDocumentOwner]

    @extend_schema(summary="Retrieve document", responses={200: DocumentDetailSerializer})
    def get(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        self.check_object_permissions(request, doc)
        return Response(DocumentDetailSerializer(doc).data)


class DocumentRetryView(APIView):
    """Retry audit"""

    permission_classes = [IsAuthenticated, IsDocumentOwner]

    @extend_schema(summary="Retry audit", responses={200: DocumentDetailSerializer})
    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        self.check_object_permissions(request, doc)
        if doc.status != Document.Status.FAILED:
            return Response(
                {"detail": "Only failed documents can be retried."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        doc.status = Document.Status.UPLOADED
        doc.failure_reason = ""
        doc.save(update_fields=["status", "failure_reason", "updated_at"])
        process_document.delay(str(doc.id))
        return Response(DocumentDetailSerializer(doc).data)


class DocumentExportView(APIView):
    """Export audit"""

    permission_classes = [IsAuthenticated, IsDocumentOwner, IsTierB2B]

    @extend_schema(summary="Export audit", request=DocumentExportSerializer, responses={200: dict})
    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        self.check_object_permissions(request, doc)
        serializer = DocumentExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        fmt = serializer.validated_data["format"]

        signed_url, _ = generate_signed_url(doc.cloudinary_public_id, ttl_seconds=3600)
        return Response(
            {
                "document_id": str(doc.id),
                "original_filename": doc.original_filename,
                "format": fmt,
                "download_url": signed_url,
                "overall_risk_score": doc.overall_risk_score,
                "score_breakdown": doc.score_breakdown,
            }
        )
