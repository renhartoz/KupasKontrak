from django.urls import path
from chat.views import ClauseAskView, InquiryHistoryView, DocumentAskView, DocumentInquiryHistoryView

urlpatterns = [
    path("clauses/<str:clause_id>/ask/", ClauseAskView.as_view(), name="clause-ask"),
    path("clauses/<str:clause_id>/inquiries/", InquiryHistoryView.as_view(), name="inquiry-history"),
    path("documents/<str:document_id>/ask/", DocumentAskView.as_view(), name="document-ask"),
    path("documents/<str:document_id>/inquiries/", DocumentInquiryHistoryView.as_view(), name="document-inquiry-history"),
]
