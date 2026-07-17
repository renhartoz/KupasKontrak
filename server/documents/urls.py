from django.urls import path
from documents.views import (
    DocumentDetailView,
    DocumentExportView,
    DocumentListView,
    DocumentRetryView,
    DocumentUploadView,
)

urlpatterns = [
    path("upload/", DocumentUploadView.as_view(), name="document-upload"),
    path("", DocumentListView.as_view(), name="document-list"),
    path("<uuid:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path("<uuid:pk>/retry/", DocumentRetryView.as_view(), name="document-retry"),
    path("<uuid:pk>/export/", DocumentExportView.as_view(), name="document-export"),
]
