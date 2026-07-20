from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User


class AccountsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="StrongPassword123!",
            tier=User.Tier.B2C_ESENSIAL,
        )
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.profile_url = reverse("profile")

    def test_user_creation(self):
        self.assertEqual(self.user.username, "testuser")
        self.assertEqual(self.user.tier, User.Tier.B2C_ESENSIAL)
        self.assertTrue(self.user.check_password("StrongPassword123!"))

    def test_register_account(self):
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "NewStrongPassword123!",
            "tier": User.Tier.B2B_PROFESIONAL,
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "newuser")
        self.assertEqual(response.data["tier"], User.Tier.B2B_PROFESIONAL)

    def test_login_account(self):
        data = {
            "username": "testuser",
            "password": "StrongPassword123!",
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_profile_retrieve_and_update(self):
        self.client.force_authenticate(user=self.user)
        get_response = self.client.get(self.profile_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data["email"], "testuser@example.com")

        patch_data = {"email": "updated@example.com"}
        patch_response = self.client.patch(self.profile_url, patch_data)
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["email"], "updated@example.com")
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "updated@example.com")
