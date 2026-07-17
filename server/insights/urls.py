from django.urls import path
from insights.views import (
    DraftCreateView,
    DraftDetailView,
    DraftListView,
    RecommendationListView,
    VisualizationListView,
)

urlpatterns = [
    path("documents/<uuid:document_id>/visualizations/", VisualizationListView.as_view(), name="visualization-list"),
    path("documents/<uuid:document_id>/recommendations/", RecommendationListView.as_view(), name="recommendation-list"),
    path("documents/<uuid:document_id>/drafts/", DraftCreateView.as_view(), name="draft-create"),
    path("documents/<uuid:document_id>/drafts/list/", DraftListView.as_view(), name="draft-list"),
    path("drafts/<uuid:pk>/", DraftDetailView.as_view(), name="draft-detail"),
]
