from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from audits.models import ClauseFinding
from chat.models import ClauseInquiry
from chat.serializers import ClauseAskSerializer, ClauseInquirySerializer
from core.pagination import StandardPageNumberPagination
from documents.services.llm_gateway import ask_clause_question


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

        # Fetch up to 3 previous inquiries for context (latest first, then reverse for chronological order)
        previous_inquiries = list(ClauseInquiry.objects.filter(
            clause=clause, user=request.user
        ).order_by("-created_at")[:3])
        previous_inquiries.reverse()
        
        history = []
        for inq in previous_inquiries:
            history.append({"role": "user", "content": inq.question})
            history.append({"role": "assistant", "content": inq.answer})

        answer = ask_clause_question(
            clause.clause_text, 
            clause.legal_reference, 
            question, 
            full_document_text=clause.document.extracted_text or "",
            history=history
        )
        inquiry = ClauseInquiry.objects.create(
            clause=clause,
            user=request.user,
            question=question,
            answer=answer,
        )
        return Response(ClauseInquirySerializer(inquiry).data, status=status.HTTP_201_CREATED)


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
