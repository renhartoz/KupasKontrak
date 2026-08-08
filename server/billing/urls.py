from django.urls import path
from .views import CreateTransactionView, MidtransWebhookView, CheckTransactionStatusView

app_name = "billing"

urlpatterns = [
    path("transaction/", CreateTransactionView.as_view(), name="transaction-create"),
    path("webhook/", MidtransWebhookView.as_view(), name="webhook"),
    path("status/<str:order_id>/", CheckTransactionStatusView.as_view(), name="transaction-status"),
]
