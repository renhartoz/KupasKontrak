import uuid
import logging
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Transaction
from .services import create_snap_transaction, verify_webhook_signature, check_transaction_status
from accounts.models import User

logger = logging.getLogger(__name__)

class CreateTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        plan = request.data.get('plan', 'profesional').lower()
        
        PRICING_TIERS = {
            'profesional': 49000,
        }
        
        if plan == 'enterprise':
            return Response({"error": "Enterprise plan requires contacting sales. Please contact our moderator."}, status=status.HTTP_400_BAD_REQUEST)

        
        if plan not in PRICING_TIERS:
            return Response({"error": "Invalid plan selected."}, status=status.HTTP_400_BAD_REQUEST)

        amount = PRICING_TIERS[plan]

        order_id = f"ORDER-{uuid.uuid4().hex[:10].upper()}"

        with transaction.atomic():
            trx = Transaction.objects.create(
                order_id=order_id,
                user=user,
                amount=amount,
                status='pending'
            )
        
        customer_details = {
            "first_name": user.first_name or user.username or "Pengguna",
            "last_name": user.last_name or "",
            "email": user.email,
            "phone": getattr(user, "phone", None) or "080000000000",
        }

        item_details = [{
            "id": plan,
            "price": amount,
            "quantity": 1,
            "name": f"Paket B2B {plan.title()}"
        }]

        try:
            snap_res = create_snap_transaction(order_id, amount, customer_details, item_details)
            trx.snap_token = snap_res.get('token')
            trx.snap_redirect_url = snap_res.get('redirect_url')
            trx.save(update_fields=['snap_token', 'snap_redirect_url', 'updated_at'])
            
            return Response({
                "token": trx.snap_token,
                "redirect_url": trx.snap_redirect_url,
                "order_id": order_id
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": "Failed to create transaction with payment gateway."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MidtransWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            notification = request.data
            
            if not verify_webhook_signature(notification):
                logger.warning("Invalid webhook signature received.")
                return Response({"error": "Invalid signature"}, status=status.HTTP_403_FORBIDDEN)
            
            order_id = notification.get('order_id')
            transaction_status = notification.get('transaction_status')
            payment_type = notification.get('payment_type')
            
            try:
                trx = Transaction.objects.select_for_update().get(order_id=order_id)
            except Transaction.DoesNotExist:
                return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

            with transaction.atomic():
                if transaction_status == 'settlement' or transaction_status == 'capture':
                    trx.status = 'settlement'
                    
                    user = trx.user
                    user.tier = User.Tier.B2B_PROFESIONAL
                    user.save(update_fields=['tier'])
                elif transaction_status in ['deny', 'cancel', 'expire', 'failure']:
                    trx.status = transaction_status
                elif transaction_status == 'pending':
                    trx.status = 'pending'

                trx.payment_type = payment_type
                trx.save(update_fields=['status', 'payment_type', 'updated_at'])

            return Response({"status": "ok"})
            
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            return Response({"error": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckTransactionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            with transaction.atomic():
                try:
                    trx = Transaction.objects.select_for_update().get(order_id=order_id, user=request.user)
                except Transaction.DoesNotExist:
                    return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

                status_res = check_transaction_status(order_id)
                transaction_status = status_res.get('transaction_status')
                payment_type = status_res.get('payment_type')

                if transaction_status == 'settlement' or transaction_status == 'capture':
                    trx.status = 'settlement'
                    user = trx.user
                    user.tier = User.Tier.B2B_PROFESIONAL
                    user.save(update_fields=['tier'])
                elif transaction_status in ['deny', 'cancel', 'expire', 'failure']:
                    trx.status = transaction_status
                elif transaction_status == 'pending':
                    trx.status = 'pending'

                if payment_type:
                    trx.payment_type = payment_type
                trx.save(update_fields=['status', 'payment_type', 'updated_at'])

                return Response({"status": trx.status})
        except Exception as e:
            logger.error(f"Error manually checking status: {e}")
            return Response({"error": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
