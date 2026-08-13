from django.utils import timezone
from documents.models import Document
from accounts.models import User

QUOTA_LIMITS = {
    User.Tier.B2C_ESENSIAL: 5,
    User.Tier.B2B_PROFESIONAL: 50,
}

def get_user_quota_status(user: User):
    """
    Returns the quota status for a given user.
    """
    now = timezone.now()
    documents_this_month = Document.objects.filter(
        owner=user,
        created_at__year=now.year,
        created_at__month=now.month
    ).count()

    monthly_limit = QUOTA_LIMITS.get(user.tier, QUOTA_LIMITS[User.Tier.B2C_ESENSIAL])
    remaining_monthly = max(0, monthly_limit - documents_this_month)
    extra_tokens = user.extra_document_tokens
    can_upload = remaining_monthly > 0 or extra_tokens > 0

    return {
        "monthly_limit": monthly_limit,
        "used_this_month": documents_this_month,
        "remaining_monthly": remaining_monthly,
        "extra_tokens": extra_tokens,
        "can_upload": can_upload
    }

def consume_upload_quota(user: User) -> bool:
    """
    Attempts to consume quota for uploading a document.
    Returns True if successful, False if out of quota.
    This should be called right before saving a new document.
    """
    status = get_user_quota_status(user)
    
    if not status["can_upload"]:
        return False
        
    if status["remaining_monthly"] <= 0 and status["extra_tokens"] > 0:
        user.extra_document_tokens -= 1
        user.save(update_fields=['extra_document_tokens'])
        
    return True
