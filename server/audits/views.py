from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from audits.models import AuditEvent, ClauseFinding
from audits.serializers import AuditEventSerializer, ClauseFindingSerializer
from core.pagination import StandardPageNumberPagination
from documents.models import Document


class ClauseListView(APIView):
    """List clauses"""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPageNumberPagination

    @extend_schema(summary="List clauses", responses={200: ClauseFindingSerializer(many=True)})
    def get(self, request, document_id):
        doc = get_object_or_404(Document, pk=document_id)
        if doc.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        queryset = ClauseFinding.objects.filter(document=doc).order_by("order_index")
        risk_level = request.query_params.get("risk_level")
        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)
        category = request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(ClauseFindingSerializer(page, many=True).data)
        return Response(ClauseFindingSerializer(queryset, many=True).data)


class ClauseDetailView(APIView):
    """Retrieve clause"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Retrieve clause", responses={200: ClauseFindingSerializer})
    def get(self, request, pk):
        clause = get_object_or_404(ClauseFinding, pk=pk)
        if clause.document.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        return Response(ClauseFindingSerializer(clause).data)


class AuditEventsView(APIView):
    """List audit events"""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPageNumberPagination

    @extend_schema(summary="List audit events", responses={200: AuditEventSerializer(many=True)})
    def get(self, request, document_id):
        doc = get_object_or_404(Document, pk=document_id)
        if doc.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        queryset = AuditEvent.objects.filter(document=doc).order_by("sequence_number")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(AuditEventSerializer(page, many=True).data)
        return Response(AuditEventSerializer(queryset, many=True).data)
