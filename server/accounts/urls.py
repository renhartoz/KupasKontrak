from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    UserLoginView,
    UserLogoutView,
    UserProfileView,
    UserRegisterView,
)

urlpatterns = [
    path("register/", UserRegisterView.as_view(), name="register"),
    path("login/", UserLoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
    path("me/", UserProfileView.as_view(), name="profile"),
]
