from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from accounts.serializers import (
    UserProfileSerializer,
    UserRegisterSerializer,
)


class UserRegisterView(APIView):
    """Register user"""

    permission_classes = [AllowAny]

    @extend_schema(summary="Register account", request=UserRegisterSerializer, responses={201: UserProfileSerializer})
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)


class UserLoginView(TokenObtainPairView):
    """Authenticate user"""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh")
            refresh_token = response.data.pop(refresh_cookie_name, response.data.pop("refresh", None))
            if refresh_token:
                cookie_max_age = int(settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME").total_seconds())
                response.set_cookie(
                    key=refresh_cookie_name,
                    value=refresh_token,
                    max_age=cookie_max_age,
                    secure=settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", True),
                    httponly=settings.SIMPLE_JWT.get("AUTH_COOKIE_HTTP_ONLY", True),
                    samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax"),
                )
        return response


class UserLogoutView(APIView):
    """Logout user"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Logout session", responses={205: None})
    def post(self, request):
        refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh")
        refresh_token = request.COOKIES.get(refresh_cookie_name) or request.data.get("refresh")
        
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
                
        response = Response(status=status.HTTP_205_RESET_CONTENT)
        response.delete_cookie(refresh_cookie_name)
        return response


class UserProfileView(APIView):
    """Profile details"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Retrieve profile", responses={200: UserProfileSerializer})
    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    @extend_schema(summary="Update profile", request=UserProfileSerializer, responses={200: UserProfileSerializer})
    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
