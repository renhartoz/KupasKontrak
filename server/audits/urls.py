from django.urls import path
from audits.views import AuditEventsView, ClauseDetailView, ClauseListView

urlpatterns = [
    path("documents/<uuid:document_id>/clauses/", ClauseListView.as_view(), name="clause-list"),
    path("clauses/<str:pk>/", ClauseDetailView.as_view(), name="clause-detail"),
    path("documents/<uuid:document_id>/audit-events/", AuditEventsView.as_view(), name="audit-events"),
]
