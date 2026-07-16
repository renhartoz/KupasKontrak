import json
import requests
from django.conf import settings
from insights.models import GeneratedContractDraft


def generate_draft(document, user, draft_type, custom_instructions=None) -> GeneratedContractDraft:
    clauses = list(document.clauses.all())
    provider = getattr(settings, "LLM_PROVIDER", "groq").lower()

    flagged_summary = "\n".join(
        f"- ID: {c.id} | Skor: {c.clause_safety_score} | Teks: {c.clause_text} | Kategori: {c.category}"
        for c in clauses
        if c.clause_safety_score <= 3
    )

    instructions_part = f"\nInstruksi Tambahan Pengguna: {custom_instructions}" if custom_instructions else ""
    system_msg = (
        "Anda adalah spesialis perancangan kontrak hukum ketenagakerjaan Indonesia. "
        "Tugas Anda adalah merancang draf perbaikan kontrak yang adil bagi pekerja informal dan pemberi kerja, "
        "memperbaiki klausul-klausul bermasalah agar sesuai dengan regulasi positif Indonesia.\n\n"
        "Anda WAJIB mengembalikan respons dalam format JSON murni.\n"
        "Jika draft_type == 'full_rewrite', format JSON: "
        '{"title": "Perjanjian Kerja Lepas", "sections": [{"section_title": "Pasal 1", "content": "..."}]}\n'
        "Jika draft_type == 'clause_patch', format JSON: "
        '{"patches": [{"clause_id": "c-xxxx", "original_text": "...", "proposed_patch_text": "...", "rationale": "..."}]}'
    )
    user_msg = (
        f"Tipe Draf: {draft_type}\n"
        f"Daftar Klausul Bermasalah:\n{flagged_summary or 'Semua klausul aman.'}{instructions_part}"
    )

    if provider == "groq":
        api_key = getattr(settings, "GROQ_API_KEY", "")
        endpoint = "https://api.groq.com/openai/v1/chat/completions"
        model = "llama-3.3-70b-versatile"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    else:
        api_key = getattr(settings, "OPENROUTER_API_KEY", "")
        endpoint = "https://openrouter.ai/api/v1/chat/completions"
        models = getattr(settings, "OPENROUTER_MODEL_CHAIN", ["google/gemini-2.5-flash"])
        model = models[0] if models else "google/gemini-2.5-flash"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-Title": "KupasKontrak",
        }

    try:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=45)
        resp.raise_for_status()
        data = resp.json()
        content_json = json.loads(data["choices"][0]["message"]["content"])
    except Exception:
        if draft_type == GeneratedContractDraft.DraftType.CLAUSE_PATCH:
            content_json = {
                "patches": [
                    {
                        "clause_id": c.id,
                        "original_text": c.clause_text,
                        "proposed_patch_text": f"Penyempurnaan klausul {c.id}: {c.plain_language_summary} dengan batas waktu terukur dan kesepakatan tertulis bersama.",
                        "rationale": "Menyeimbangkan posisi tawar kedua belah pihak.",
                    }
                    for c in clauses
                    if c.clause_safety_score <= 3
                ]
            }
        else:
            content_json = {
                "title": f"Draf Revisi Perjanjian Kerja ({document.original_filename})",
                "sections": [
                    {
                        "section_title": "Pasal 1 - Lingkup dan Batasan Kerja",
                        "content": "Pekerja setuju melaksanakan tugas sesuai spesifikasi proyek dengan hak kompensasi yang dibayarkan tepat waktu.",
                    },
                    {
                        "section_title": "Pasal 2 - Hak dan Kewajiban",
                        "content": "Segala bentuk pembatasan hak cipta atau non-kompete dibatasi maksimal 6 bulan dan disertai kompensasi wajar.",
                    },
                ],
            }

    draft = GeneratedContractDraft.objects.create(
        document=document,
        requested_by=user,
        draft_type=draft_type,
        content=content_json,
    )
    return draft
