from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from audits.models import AuditEvent, ClauseFinding
from documents.models import Document


class AuditsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="audituser",
            email="audit@example.com",
            password="StrongPassword123!",
            tier=User.Tier.B2C_ESENSIAL,
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="StrongPassword123!",
            tier=User.Tier.B2C_ESENSIAL,
        )
        self.document = Document.objects.create(
            owner=self.user,
            original_filename="audit_doc.pdf",
            file_size_bytes=2048,
            cloudinary_public_id="audit_pub_id",
            status=Document.Status.DONE,
        )
        self.clause1 = ClauseFinding.objects.create(
            id="clause-1",
            document=self.document,
            clause_text="Pembayaran wajib dilakukan dalam 30 hari.",
            clause_safety_score=4,
            category="pembayaran",
            risk_level=ClauseFinding.RiskLevel.HIJAU_TUA,
            plain_language_summary="Pembayaran standar.",
            order_index=0,
        )
        self.clause2 = ClauseFinding.objects.create(
            id="clause-2",
            document=self.document,
            clause_text="Perusahaan berhak membatalkan sepihak tanpa alasan.",
            clause_safety_score=1,
            category="pemutusan",
            risk_level=ClauseFinding.RiskLevel.MERAH_TUA,
            plain_language_summary="Klausul berbahaya sepihak.",
            order_index=1,
        )
        self.event1 = AuditEvent.objects.create(
            document=self.document,
            event_type=AuditEvent.EventType.EXTRACTION_STARTED,
            payload={"msg": "start"},
            sequence_number=1,
        )
        self.event2 = AuditEvent.objects.create(
            document=self.document,
            event_type=AuditEvent.EventType.EXTRACTION_DONE,
            payload={"msg": "done"},
            sequence_number=2,
        )
        self.clause_list_url = reverse("clause-list", kwargs={"document_id": self.document.pk})
        self.clause_detail_url = reverse("clause-detail", kwargs={"pk": self.clause1.pk})
        self.audit_events_url = reverse("audit-events", kwargs={"document_id": self.document.pk})

    def test_list_clauses_with_filters_and_permissions(self):
        self.client.force_authenticate(user=self.other_user)
        forbidden_resp = self.client.get(self.clause_list_url)
        self.assertEqual(forbidden_resp.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user)
        resp_all = self.client.get(self.clause_list_url)
        self.assertEqual(resp_all.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_all.data["results"]), 2)

        resp_red = self.client.get(self.clause_list_url, {"risk_level": ClauseFinding.RiskLevel.MERAH_TUA})
        self.assertEqual(len(resp_red.data["results"]), 1)
        self.assertEqual(resp_red.data["results"][0]["id"], "clause-2")

        resp_cat = self.client.get(self.clause_list_url, {"category": "pembayaran"})
        self.assertEqual(len(resp_cat.data["results"]), 1)
        self.assertEqual(resp_cat.data["results"][0]["id"], "clause-1")

    def test_clause_detail(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(self.clause_detail_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["clause_safety_score"], 4)

    def test_audit_events_ordering(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(self.audit_events_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["results"]
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["sequence_number"], 1)
        self.assertEqual(results[1]["sequence_number"], 2)
