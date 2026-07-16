import uuid
from django.db import models


class ClauseInquiry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clause = models.ForeignKey(
        "audits.ClauseFinding", on_delete=models.CASCADE, related_name="inquiries"
    )
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
