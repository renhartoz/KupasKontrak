import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Tier(models.TextChoices):
        B2C_ESENSIAL = "b2c_esensial", "B2C Esensial"
        B2B_PROFESIONAL = "b2b_profesional", "B2B Profesional"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    tier = models.CharField(
        max_length=32, choices=Tier.choices, default=Tier.B2C_ESENSIAL
    )
    created_at = models.DateTimeField(auto_now_add=True)
