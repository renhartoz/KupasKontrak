from insights.models import ActionRecommendation


def generate_recommendations(document):
    ActionRecommendation.objects.filter(document=document).delete()
    clauses = list(document.clauses.all())
    created = []

    for c in clauses:
        if c.clause_safety_score == 1:
            rec = ActionRecommendation.objects.create(
                document=document,
                clause=c,
                action_type=ActionRecommendation.ActionType.REJECT,
                priority=ActionRecommendation.Priority.TINGGI,
                recommendation_text=(
                    f"Tolak klausul [{c.id}] ini karena bertentangan mutlak dengan hukum. "
                    "Mintalah pihak pemberi kerja untuk menghapus pasal ini sebelum penandatanganan."
                ),
            )
            created.append(rec)
        elif c.clause_safety_score == 2:
            rec = ActionRecommendation.objects.create(
                document=document,
                clause=c,
                action_type=ActionRecommendation.ActionType.NEGOTIATE,
                priority=ActionRecommendation.Priority.TINGGI,
                recommendation_text=(
                    f"Negosiasikan ulang klausul [{c.id}] untuk mengurangi risiko eksploitasi. "
                    f"Sampaikan alternatif yang lebih adil sesuai rangkuman bahasa awam: {c.plain_language_summary}"
                ),
            )
            created.append(rec)
        elif c.clause_safety_score == 3:
            rec = ActionRecommendation.objects.create(
                document=document,
                clause=c,
                action_type=ActionRecommendation.ActionType.REQUEST_CLARIFICATION,
                priority=ActionRecommendation.Priority.SEDANG,
                recommendation_text=(
                    f"Mintalah klarifikasi tertulis untuk klausul [{c.id}] guna memperjelas scope "
                    "serta batasan waktu/wilayah agar tidak menimbulkan multitafsir di kemudian hari."
                ),
            )
            created.append(rec)

    if not created and clauses:
        general_rec = ActionRecommendation.objects.create(
            document=document,
            clause=None,
            action_type=ActionRecommendation.ActionType.ACCEPT_WITH_CONDITION,
            priority=ActionRecommendation.Priority.RENDAH,
            recommendation_text=(
                "Secara umum kontrak berada dalam batas aman. Pastikan seluruh lampiran teknis "
                "dan ruang lingkup kerja telah dilampirkan sebelum tanda tangan."
            ),
        )
        created.append(general_rec)

    return created
