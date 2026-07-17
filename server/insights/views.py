from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.pagination import StandardPageNumberPagination
from core.permissions import IsDocumentOwner, IsTierB2B
from documents.models import Document
from insights.models import (
    ActionRecommendation,
    ContractVisualization,
    GeneratedContractDraft,
)
from insights.serializers import (
    ActionRecommendationSerializer,
    ContractVisualizationSerializer,
    DraftCreateSerializer,
    GeneratedContractDraftSerializer,
)
from insights.tasks import generate_contract_draft_task


class VisualizationListView(APIView):
    """List visualizations"""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPageNumberPagination

    @extend_schema(summary="List visualizations", responses={200: ContractVisualizationSerializer(many=True)})
    def get(self, request, document_id):
        doc = get_object_or_404(Document, pk=document_id)
        if doc.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        queryset = ContractVisualization.objects.filter(document=doc).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(ContractVisualizationSerializer(page, many=True).data)
        return Response(ContractVisualizationSerializer(queryset, many=True).data)


class RecommendationListView(APIView):
    """List recommendations"""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPageNumberPagination

    @extend_schema(summary="List recommendations", responses={200: ActionRecommendationSerializer(many=True)})
    def get(self, request, document_id):
        doc = get_object_or_404(Document, pk=document_id)
        if doc.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        queryset = ActionRecommendation.objects.filter(document=doc).order_by("priority", "created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(ActionRecommendationSerializer(page, many=True).data)
        return Response(ActionRecommendationSerializer(queryset, many=True).data)


class DraftCreateView(APIView):
    """Create draft"""

    permission_classes = [IsAuthenticated, IsDocumentOwner, IsTierB2B]

    @extend_schema(summary="Create draft", request=DraftCreateSerializer, responses={202: dict})
    def post(self, request, document_id):
        doc = get_object_or_404(Document, pk=document_id)
        self.check_object_permissions(request, doc)

        serializer = DraftCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        draft_type = serializer.validated_data["draft_type"]
        custom_instructions = serializer.validated_data.get("custom_instructions", "")

        generate_contract_draft_task.delay(str(doc.id), str(request.user.id), draft_type, custom_instructions)
        return Response(
            {"status": "processing", "message": "Draft generation task initiated."},
            status=status.HTTP_202_ACCEPTED,
        )


class DraftListView(APIView):
    """List drafts"""

    permission_classes = [IsAuthenticated, IsDocumentOwner, IsTierB2B]
    pagination_class = StandardPageNumberPagination

    @extend_schema(summary="List drafts", responses={200: GeneratedContractDraftSerializer(many=True)})
    def get(self, request, document_id):
        doc = get_object_or_404(Document, pk=document_id)
        self.check_object_permissions(request, doc)

        queryset = GeneratedContractDraft.objects.filter(document=doc).order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(GeneratedContractDraftSerializer(page, many=True).data)
        return Response(GeneratedContractDraftSerializer(queryset, many=True).data)


class DraftDetailView(APIView):
    """Retrieve draft"""

    permission_classes = [IsAuthenticated, IsTierB2B]

    @extend_schema(summary="Retrieve draft", responses={200: GeneratedContractDraftSerializer})
    def get(self, request, pk):
        draft = get_object_or_404(GeneratedContractDraft, pk=pk)
        if draft.document.owner != request.user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        return Response(GeneratedContractDraftSerializer(draft).data)
