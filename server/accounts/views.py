from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from accounts.serializers import (
    LogoutSerializer,
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


class UserLogoutView(APIView):
    """Logout user"""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Logout session", request=LogoutSerializer, responses={205: None})
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = RefreshToken(serializer.validated_data["refresh"])
        token.blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)


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
