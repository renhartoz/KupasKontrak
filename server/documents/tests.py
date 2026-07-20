from unittest.mock import patch
import fitz
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from documents.models import Document
from documents.services.extraction import sanitize_pdf_bytes


class DocumentsTests(APITestCase):
    def setUp(self):
        self.user_b2c = User.objects.create_user(
            username="b2cuser",
            email="b2c@example.com",
            password="StrongPassword123!",
            tier=User.Tier.B2C_ESENSIAL,
        )
        self.user_b2b = User.objects.create_user(
            username="b2buser",
            email="b2b@example.com",
            password="StrongPassword123!",
            tier=User.Tier.B2B_PROFESIONAL,
        )
        self.document = Document.objects.create(
            owner=self.user_b2c,
            original_filename="contract.pdf",
            file_size_bytes=1024,
            cloudinary_public_id="test_public_id",
            status=Document.Status.UPLOADED,
        )
        self.upload_url = reverse("document-upload")
        self.list_url = reverse("document-list")
        self.detail_url = reverse("document-detail", kwargs={"pk": self.document.pk})
        self.retry_url = reverse("document-retry", kwargs={"pk": self.document.pk})
        self.export_url = reverse("document-export", kwargs={"pk": self.document.pk})

    def test_sanitize_pdf_bytes(self):
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "Test PDF content")
        raw_bytes = doc.tobytes()
        doc.close()

        cleaned_bytes = sanitize_pdf_bytes(raw_bytes)
        cleaned_doc = fitz.open(stream=cleaned_bytes, filetype="pdf")
        self.assertEqual(cleaned_doc.page_count, 1)
        cleaned_doc.close()

    @patch("documents.views.process_document.delay")
    @patch("documents.views.upload_document")
    def test_upload_document(self, mock_upload, mock_delay):
        mock_upload.return_value = {"public_id": "new_public_id", "secure_url": "http://example.com/doc.pdf"}
        self.client.force_authenticate(user=self.user_b2c)

        file_content = b"%PDF-1.4 dummy pdf bytes"
        pdf_file = SimpleUploadedFile("new_contract.pdf", file_content, content_type="application/pdf")

        response = self.client.post(self.upload_url, {"file": pdf_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["original_filename"], "new_contract.pdf")
        self.assertEqual(response.data["status"], Document.Status.UPLOADED)
        mock_upload.assert_called_once()
        mock_delay.assert_called_once()

    def test_list_and_detail_documents(self):
        self.client.force_authenticate(user=self.user_b2c)
        list_response = self.client.get(self.list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data["results"]), 1)

        detail_response = self.client.get(self.detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["original_filename"], "contract.pdf")

    @patch("documents.views.process_document.delay")
    def test_retry_failed_document(self, mock_delay):
        self.client.force_authenticate(user=self.user_b2c)
        fail_response = self.client.post(self.retry_url)
        self.assertEqual(fail_response.status_code, status.HTTP_400_BAD_REQUEST)

        self.document.status = Document.Status.FAILED
        self.document.failure_reason = "Extraction error"
        self.document.save()

        success_response = self.client.post(self.retry_url)
        self.assertEqual(success_response.status_code, status.HTTP_200_OK)
        self.assertEqual(success_response.data["status"], Document.Status.UPLOADED)
        self.assertEqual(success_response.data["failure_reason"], "")
        mock_delay.assert_called_once_with(str(self.document.pk))

    @patch("documents.views.generate_signed_url")
    def test_export_document_permissions(self, mock_signed):
        mock_signed.return_value = ("http://example.com/signed.pdf", 3600)

        self.client.force_authenticate(user=self.user_b2c)
        b2c_response = self.client.post(self.export_url, {"format": "pdf"})
        self.assertEqual(b2c_response.status_code, status.HTTP_403_FORBIDDEN)

        self.document.owner = self.user_b2b
        self.document.save()
        self.client.force_authenticate(user=self.user_b2b)
        b2b_response = self.client.post(self.export_url, {"format": "pdf"})
        self.assertEqual(b2b_response.status_code, status.HTTP_200_OK)
        self.assertEqual(b2b_response.data["format"], "pdf")
        self.assertEqual(b2b_response.data["download_url"], "http://example.com/signed.pdf")
