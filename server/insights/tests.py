from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from audits.models import ClauseFinding
from documents.models import Document
from insights.models import ActionRecommendation, ContractVisualization, GeneratedContractDraft
from insights.services.recommendation_generator import generate_recommendations
from insights.services.scoring import compute_document_score
from insights.services.visualization_generator import generate_visualizations


class InsightsTests(APITestCase):
    def setUp(self):
        self.user_b2c = User.objects.create_user(
            username="insights_b2c",
            email="insights_b2c@example.com",
            password="StrongPassword123!",
            tier=User.Tier.B2C_ESENSIAL,
        )
        self.user_b2b = User.objects.create_user(
            username="insights_b2b",
            email="insights_b2b@example.com",
            password="StrongPassword123!",
            tier=User.Tier.B2B_PROFESIONAL,
        )
        self.document = Document.objects.create(
            owner=self.user_b2b,
            original_filename="insights_doc.pdf",
            file_size_bytes=4096,
            cloudinary_public_id="insights_pub_id",
            status=Document.Status.DONE,
        )
        self.clause1 = ClauseFinding.objects.create(
            id="insight-clause-1",
            document=self.document,
            clause_text="Klausul pembayaran standar.",
            clause_safety_score=5,
            category="pembayaran",
            risk_level=ClauseFinding.RiskLevel.HIJAU_TUA,
            plain_language_summary="Aman.",
            order_index=0,
        )
        self.clause2 = ClauseFinding.objects.create(
            id="insight-clause-2",
            document=self.document,
            clause_text="Denda keterlambatan 50% per hari.",
            clause_safety_score=1,
            category="sanksi",
            risk_level=ClauseFinding.RiskLevel.MERAH_TUA,
            plain_language_summary="Sangat merugikan.",
            order_index=1,
        )
        self.vis_url = reverse("visualization-list", kwargs={"document_id": self.document.pk})
        self.rec_url = reverse("recommendation-list", kwargs={"document_id": self.document.pk})
        self.draft_create_url = reverse("draft-create", kwargs={"document_id": self.document.pk})
        self.draft_list_url = reverse("draft-list", kwargs={"document_id": self.document.pk})

    def test_scoring_formula_calculation(self):
        score, breakdown, fatal_count = compute_document_score(self.document)
        self.assertEqual(fatal_count, 1)
        self.assertEqual(score, 35.0)
        breakdown_cats = [b["category"] for b in breakdown]
        self.assertIn("pembayaran", breakdown_cats)
        self.assertIn("sanksi", breakdown_cats)

    def test_visualization_and_recommendation_generators(self):
        vis_list = generate_visualizations(self.document)
        self.assertEqual(len(vis_list), 2)
        self.assertEqual(vis_list[0].scenario_type, ContractVisualization.ScenarioType.CLAUSE_IMPACT)
        self.assertEqual(vis_list[1].scenario_type, ContractVisualization.ScenarioType.BEFORE_AFTER)

        rec_list = generate_recommendations(self.document)
        self.assertEqual(len(rec_list), 1)
        self.assertEqual(rec_list[0].action_type, ActionRecommendation.ActionType.REJECT)

    def test_visualization_and_recommendation_views(self):
        generate_visualizations(self.document)
        generate_recommendations(self.document)

        self.client.force_authenticate(user=self.user_b2b)
        vis_resp = self.client.get(self.vis_url)
        self.assertEqual(vis_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(vis_resp.data["results"]), 2)

        rec_resp = self.client.get(self.rec_url)
        self.assertEqual(rec_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(rec_resp.data["results"]), 1)

    @patch("insights.views.generate_contract_draft_task.delay")
    def test_draft_create_and_list_b2b_permissions(self, mock_delay):
        self.client.force_authenticate(user=self.user_b2c)
        b2c_resp = self.client.post(self.draft_create_url, {"draft_type": GeneratedContractDraft.DraftType.FULL_REWRITE})
        self.assertEqual(b2c_resp.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_b2b)
        b2b_resp = self.client.post(
            self.draft_create_url,
            {
                "draft_type": GeneratedContractDraft.DraftType.FULL_REWRITE,
                "custom_instructions": "Buat lebih seimbang.",
            },
        )
        self.assertEqual(b2b_resp.status_code, status.HTTP_202_ACCEPTED)
        mock_delay.assert_called_once_with(
            str(self.document.pk),
            str(self.user_b2b.pk),
            GeneratedContractDraft.DraftType.FULL_REWRITE,
            "Buat lebih seimbang.",
        )

        draft = GeneratedContractDraft.objects.create(
            document=self.document,
            requested_by=self.user_b2b,
            draft_type=GeneratedContractDraft.DraftType.FULL_REWRITE,
            content="Draft revision text...",
            disclaimer="Disclaimer text...",
        )
        list_resp = self.client.get(self.draft_list_url)
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_resp.data["results"]), 1)
        self.assertEqual(list_resp.data["results"][0]["id"], str(draft.pk))
