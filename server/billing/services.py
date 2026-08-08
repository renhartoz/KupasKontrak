import hashlib
import hmac
import midtransclient
from django.conf import settings

snap = midtransclient.Snap(
    is_production=settings.MIDTRANS_IS_PRODUCTION,
    server_key=settings.MIDTRANS_SERVER_KEY,
    client_key=settings.MIDTRANS_CLIENT_KEY
)

core_api = midtransclient.CoreApi(
    is_production=settings.MIDTRANS_IS_PRODUCTION,
    server_key=settings.MIDTRANS_SERVER_KEY,
    client_key=settings.MIDTRANS_CLIENT_KEY
)

def create_snap_transaction(order_id: str, gross_amount: int, customer_details: dict, item_details: list = None) -> dict:
    """
    Calls Midtrans Snap API to create a transaction.
    Returns a dict containing 'token' and 'redirect_url'.
    """
    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount
        },
        "customer_details": customer_details
    }
    
    if item_details:
        param["item_details"] = item_details
    
    try:
        transaction = snap.create_transaction(param)
        return transaction
    except Exception as e:
        import logging
        logger = logging.getLogger("Billing")
        logger.error(f"Failed to create Midtrans transaction: {e}")
        raise e

def verify_webhook_signature(notification_dict: dict) -> bool:
    """
    Verifies the SHA512 signature from Midtrans webhook notification.
    """
    order_id = notification_dict.get('order_id', '')
    status_code = notification_dict.get('status_code', '')
    gross_amount = notification_dict.get('gross_amount', '')
    signature_key = notification_dict.get('signature_key', '')
    
    server_key = settings.MIDTRANS_SERVER_KEY
    
    # signature = hash(order_id + status_code + gross_amount + ServerKey)
    data = f"{order_id}{status_code}{gross_amount}{server_key}"
    calculated_signature = hashlib.sha512(data.encode('utf-8')).hexdigest()
    
    return calculated_signature == signature_key

def check_transaction_status(order_id: str) -> dict:
    """
    Checks the real-time status of a transaction directly from Midtrans.
    """
    try:
        return core_api.transactions.status(order_id)
    except Exception as e:
        import logging
        logger = logging.getLogger("Billing")
        logger.error(f"Failed to check Midtrans status: {e}")
        raise e
