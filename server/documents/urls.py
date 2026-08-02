from django.urls import path
from documents.views import (
    DocumentDetailView,
    DocumentExportView,
    DocumentListView,
    DocumentRetryView,
    DocumentUploadView,
    document_events_view,
)

urlpatterns = [
    path("upload/", DocumentUploadView.as_view(), name="document-upload"),
    path("events/", document_events_view, name="document-events-global"),
    path("", DocumentListView.as_view(), name="document-list"),
    path("<uuid:pk>/events/", document_events_view, name="document-events-detail"),
    path("<uuid:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path("<uuid:pk>/retry/", DocumentRetryView.as_view(), name="document-retry"),
    path("<uuid:pk>/export/", DocumentExportView.as_view(), name="document-export"),
]
