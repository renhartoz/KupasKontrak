from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from accounts.models import User


class UserRegisterSerializer(serializers.ModelSerializer):
    """Register account"""

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "tier"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            tier=validated_data.get("tier", User.Tier.B2C_ESENSIAL),
        )


class UserProfileSerializer(serializers.ModelSerializer):
    """Retrieve profile"""

    class Meta:
        model = User
        fields = ["id", "username", "email", "tier", "created_at"]
        read_only_fields = ["id", "created_at"]


class LogoutSerializer(serializers.Serializer):
    """Logout session"""

    refresh = serializers.CharField()
