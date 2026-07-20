from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from audits.models import ClauseFinding
from chat.models import ClauseInquiry
from documents.models import Document


class ChatTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="chatuser",
            email="chat@example.com",
            password="StrongPassword123!",
            tier=User.Tier.B2C_ESENSIAL,
        )
        self.document = Document.objects.create(
            owner=self.user,
            original_filename="chat_doc.pdf",
            file_size_bytes=1024,
            cloudinary_public_id="chat_pub_id",
            status=Document.Status.DONE,
        )
        self.clause = ClauseFinding.objects.create(
            id="chat-clause-1",
            document=self.document,
            clause_text="Penyewa bertanggung jawab atas semua kerusakan.",
            clause_safety_score=2,
            category="kewajiban",
            risk_level=ClauseFinding.RiskLevel.MERAH_TUA,
            plain_language_summary="Penyewa ganti rugi total.",
            order_index=0,
        )
        self.ask_url = reverse("clause-ask", kwargs={"clause_id": self.clause.pk})
        self.inquiries_url = reverse("inquiry-history", kwargs={"clause_id": self.clause.pk})

    @patch("chat.views.ask_clause_question")
    def test_clause_ask_and_history(self, mock_ask):
        mock_ask.return_value = "Ini berarti Anda wajib memperbaiki kerusakan properti yang terjadi selama masa sewa."
        self.client.force_authenticate(user=self.user)

        ask_data = {"question": "Apakah saya harus bayar kalau atap bocor karena hujan?"}
        ask_response = self.client.post(self.ask_url, ask_data)
        self.assertEqual(ask_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ask_response.data["question"], ask_data["question"])
        self.assertIn("Anda wajib memperbaiki", ask_response.data["answer"])
        mock_ask.assert_called_once_with(
            self.clause.clause_text,
            self.clause.legal_reference,
            ask_data["question"],
        )

        history_response = self.client.get(self.inquiries_url)
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_response.data["results"]), 1)
        self.assertEqual(history_response.data["results"][0]["answer"], ask_response.data["answer"])
