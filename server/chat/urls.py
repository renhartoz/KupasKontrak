from django.urls import path
from chat.views import ClauseAskView, InquiryHistoryView

urlpatterns = [
    path("clauses/<str:clause_id>/ask/", ClauseAskView.as_view(), name="clause-ask"),
    path("clauses/<str:clause_id>/inquiries/", InquiryHistoryView.as_view(), name="inquiry-history"),
]
