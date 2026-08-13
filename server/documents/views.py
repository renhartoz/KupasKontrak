import asyncio
import json
from accounts.services.quota_service import consume_upload_quota
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken
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
from documents.services.export_service import generate_analysis_report_pdf, generate_fixed_contract_docx
from documents.tasks import process_document


class DocumentUploadView(APIView):
    """Upload PDF"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Upload document", request=DocumentUploadSerializer, responses={201: DocumentDetailSerializer})
    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Cek kuota sebelum lanjut
        if not consume_upload_quota(request.user):
            return Response(
                {"detail": "Batas unggahan dokumen bulanan telah tercapai. Silakan beli Token Tambahan atau Upgrade ke Pro."},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
            
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

    @extend_schema(summary="Retry audit", request=None, responses={200: DocumentDetailSerializer})
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

    permission_classes = [IsAuthenticated, IsDocumentOwner]

    @extend_schema(summary="Export audit", request=DocumentExportSerializer, responses={200: dict})
    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        self.check_object_permissions(request, doc)
        serializer = DocumentExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        fmt = serializer.validated_data["format"]

        if fmt == "contract_docx":
            # Check B2B permission for contract generation
            if request.user.tier != "b2b_profesional":
                return Response({"detail": "Requires B2B Professional tier."}, status=status.HTTP_403_FORBIDDEN)
            try:
                secure_url = generate_fixed_contract_docx(doc)
            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # report_pdf is free
            try:
                secure_url = generate_analysis_report_pdf(doc)
            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "document_id": str(doc.id),
                "original_filename": doc.original_filename,
                "format": fmt,
                "download_url": secure_url,
                "overall_risk_score": doc.overall_risk_score,
                "score_breakdown": doc.score_breakdown,
            }
        )

async def document_events_view(request, pk=None):
    token_str = request.GET.get("token")
    if not token_str:
        return StreamingHttpResponse("data: {\"error\": \"unauthorized\"}\n\n", status=401, content_type="text/event-stream")
    
    try:
        token = AccessToken(token_str)
        user_id = token["user_id"]
    except Exception:
        return StreamingHttpResponse("data: {\"error\": \"invalid token\"}\n\n", status=401, content_type="text/event-stream")

    async def event_stream():
        last_statuses = {}
        first_iteration = True
        while True:
            try:
                if pk:
                    docs = [await Document.objects.aget(pk=pk, owner_id=user_id)]
                else:
                    docs = [d async for d in Document.objects.filter(owner_id=user_id).order_by("-updated_at")[:10]]
                
                events_emitted = False
                for doc in docs:
                    doc_id = str(doc.id)
                    current_status = doc.status
                    
                    if last_statuses.get(doc_id) != current_status:
                        if not first_iteration:
                            payload = {
                                "id": doc_id,
                                "status": current_status,
                                "is_processing": current_status not in [Document.Status.DONE, Document.Status.FAILED]
                            }
                            yield f"data: {json.dumps(payload)}\n\n"
                            events_emitted = True
                        last_statuses[doc_id] = current_status
                        
                first_iteration = False
                        
                if pk and last_statuses.get(str(pk)) in [Document.Status.DONE, Document.Status.FAILED]:
                    break
                    
            except Document.DoesNotExist:
                yield "data: {\"error\": \"not found\"}\n\n"
                break
                
            if not events_emitted:
                yield ": heartbeat\n\n"
                
            await asyncio.sleep(2)
            
    return StreamingHttpResponse(event_stream(), content_type="text/event-stream")
