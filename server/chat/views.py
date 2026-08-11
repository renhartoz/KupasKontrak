from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from audits.models import ClauseFinding
from chat.models import ClauseInquiry, DocumentInquiry
from chat.serializers import ClauseAskSerializer, ClauseInquirySerializer, DocumentAskSerializer, DocumentInquirySerializer
from core.pagination import StandardPageNumberPagination
from documents.services.llm_gateway import ask_clause_question_stream, ask_document_question_stream
from documents.models import Document
from django.http import StreamingHttpResponse


class ClauseAskView(APIView):
    """Ask clause question"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Ask question", request=ClauseAskSerializer, responses={201: ClauseInquirySerializer})
    def post(self, request, clause_id):
        clause = get_object_or_404(ClauseFinding, pk=clause_id)
        if clause.document.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClauseAskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.validated_data["question"]

        previous_inquiries = list(ClauseInquiry.objects.filter(
            clause=clause, user=request.user
        ).order_by("-created_at")[:3])
        previous_inquiries.reverse()
        
        history = []
        for inq in previous_inquiries:
            history.append({"role": "user", "content": inq.question})
            history.append({"role": "assistant", "content": inq.answer})

        def stream_response():
            full_answer = []
            generator = ask_clause_question_stream(
                clause.clause_text, 
                clause.legal_reference, 
                question, 
                full_document_text=clause.document.extracted_text or "",
                history=history
            )
            for chunk in generator:
                full_answer.append(chunk)
                yield chunk
                
            final_answer = "".join(full_answer)
            ClauseInquiry.objects.create(
                clause=clause,
                user=request.user,
                question=question,
                answer=final_answer
            )
            
        return StreamingHttpResponse(stream_response(), content_type="text/plain")


class InquiryHistoryView(APIView):
    """List inquiry history"""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPageNumberPagination

    @extend_schema(summary="List inquiry history", responses={200: ClauseInquirySerializer(many=True)})
    def get(self, request, clause_id):
        clause = get_object_or_404(ClauseFinding, pk=clause_id)
        if clause.document.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        queryset = ClauseInquiry.objects.filter(clause=clause, user=request.user).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(ClauseInquirySerializer(page, many=True).data)
        return Response(ClauseInquirySerializer(queryset, many=True).data)


class DocumentAskView(APIView):
    """Ask document question"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Ask document question", request=DocumentAskSerializer, responses={201: DocumentInquirySerializer})
    def post(self, request, document_id):
        document = get_object_or_404(Document, pk=document_id)
        if document.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        serializer = DocumentAskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.validated_data["question"]

        previous_inquiries = list(DocumentInquiry.objects.filter(
            document=document, user=request.user
        ).order_by("-created_at")[:3])
        previous_inquiries.reverse()
        
        history = []
        for inq in previous_inquiries:
            history.append({"role": "user", "content": inq.question})
            history.append({"role": "assistant", "content": inq.answer})

        def stream_response():
            full_answer = []
            generator = ask_document_question_stream(
                full_document_text=document.extracted_text or "",
                question=question, 
                history=history
            )
            for chunk in generator:
                full_answer.append(chunk)
                yield chunk
                
            final_answer = "".join(full_answer)
            DocumentInquiry.objects.create(
                document=document,
                user=request.user,
                question=question,
                answer=final_answer
            )
            
        return StreamingHttpResponse(stream_response(), content_type="text/event-stream")


class DocumentInquiryHistoryView(APIView):
    """Get document inquiry history"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Document Inquiry history", responses=DocumentInquirySerializer(many=True))
    def get(self, request, document_id):
        document = get_object_or_404(Document, pk=document_id)
        if document.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        inquiries = DocumentInquiry.objects.filter(
            document=document, user=request.user
        ).order_by("-created_at")
        
        paginator = StandardPageNumberPagination()
        paginated_inquiries = paginator.paginate_queryset(inquiries, request)
        serializer = DocumentInquirySerializer(paginated_inquiries, many=True)
        return paginator.get_paginated_response(serializer.data)
