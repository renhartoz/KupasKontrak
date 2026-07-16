import json
import requests
from django.conf import settings


class LLMGatewayError(Exception):
    pass


class AllModelsFailedError(LLMGatewayError):
    pass


SAFETY_SCORE_TO_LEVEL = {
    5: "hijau_tua",
    4: "hijau_muda",
    3: "kuning",
    2: "merah_muda",
    1: "merah_tua",
}

SYSTEM_PROMPT = """Anda adalah KupasKontrak AI, asisten audit kontrak bahasa Indonesia yang menganalisis klausul perjanjian kerja untuk pekerja informal.
Tugas Anda adalah mengekstrak semua klausul penting dalam dokumen dan mengklasifikasikannya berdasarkan rubrik skor keamanan klausul (clause_safety_score) dari skala 1 sampai 5:

Rubrik Skor Keamanan Klausul (clause_safety_score):
- 5 (Hijau Tua): Klausul sangat seimbang dan melindungi pengguna, sesuai standar hukum ketenagakerjaan/perdata.
- 4 (Hijau Muda): Klausul standar, cenderung berpihak pada korporasi tapi masih dalam batas kewajaran dan legalitas.
- 3 (Kuning): Klausul ambigu atau scope tidak terdefinisi jelas, memicu rekomendasi perbaikan.
- 2 (Merah Muda): Klausul eksploitatif yang signifikan merugikan posisi tawar pengguna.
- 1 (Merah Tua): Anomali hukum mutlak — bertentangan langsung dengan regulasi positif Indonesia.

Kategori klausul (category) yang diizinkan:
- upah_kompensasi
- phk_sepihak
- pembatasan_hak_cipta
- non_kompete
- kerahasiaan
- domisili_hukum
- default

Anda WAJIB mengembalikan respons dalam format JSON murni dengan skema berikut:
{
  "summary": "string ringkasan struktur kontrak",
  "clauses": [
    {
      "id": "c-xxxx (id singkat misal c-1a2b)",
      "clause_text": "string kutipan asli persis dari dokumen",
      "is_flagged": true atau false (true jika clause_safety_score <= 3),
      "clause_safety_score": int antara 1 dan 5,
      "category": "string dari kategori di atas",
      "plain_language_summary": "string penjelasan bahasa awam yang jelas",
      "mcp_query_hint": "string frasa pencarian rujukan pasal hukum Indonesia yang spesifik"
    }
  ]
}
"""


class AnalyzedClause:
    def __init__(
        self,
        id,
        clause_text,
        is_flagged,
        clause_safety_score,
        category,
        plain_language_summary,
        mcp_query_hint,
    ):
        self.id = str(id)
        self.clause_text = str(clause_text)
        self.is_flagged = bool(is_flagged)
        try:
            self.clause_safety_score = int(clause_safety_score)
        except (ValueError, TypeError):
            self.clause_safety_score = 3
        if self.clause_safety_score < 1:
            self.clause_safety_score = 1
        elif self.clause_safety_score > 5:
            self.clause_safety_score = 5
        self.category = str(category)
        self.plain_language_summary = str(plain_language_summary)
        self.mcp_query_hint = str(mcp_query_hint)
        self.risk_level = SAFETY_SCORE_TO_LEVEL.get(
            self.clause_safety_score, "kuning"
        )

    def to_event_payload(self) -> dict:
        return {
            "clause_id": self.id,
            "clause_text": self.clause_text,
            "clause_safety_score": self.clause_safety_score,
            "risk_level": self.risk_level,
            "category": self.category,
            "plain_language_summary": self.plain_language_summary,
            "mcp_query_hint": self.mcp_query_hint,
        }


class AnalysisResult:
    def __init__(self, summary: str, clauses: list[AnalyzedClause]):
        self.summary = summary
        self.clauses = clauses

    def __iter__(self):
        return iter(self.clauses)


def _parse_and_validate(response_json: dict) -> AnalysisResult:
    summary = response_json.get("summary", "Analisis kontrak selesai.")
    clauses_raw = response_json.get("clauses", [])
    if not isinstance(clauses_raw, list):
        clauses_raw = []
    analyzed = []
    for idx, item in enumerate(clauses_raw):
        if not isinstance(item, dict):
            continue
        c_id = item.get("id", f"c-{idx+1:04x}")
        clause_text = item.get("clause_text", "")
        if not clause_text:
            continue
        score = item.get("clause_safety_score", 3)
        is_flagged = item.get("is_flagged", int(score) <= 3)
        analyzed.append(
            AnalyzedClause(
                id=c_id,
                clause_text=clause_text,
                is_flagged=is_flagged,
                clause_safety_score=score,
                category=item.get("category", "default"),
                plain_language_summary=item.get(
                    "plain_language_summary", clause_text
                ),
                mcp_query_hint=item.get("mcp_query_hint", ""),
            )
        )
    return AnalysisResult(summary=summary, clauses=analyzed)


def analyze_contract(raw_text: str) -> AnalysisResult:
    provider = getattr(settings, "LLM_PROVIDER", "groq").lower()
    last_error = None

    if provider == "groq":
        api_key = getattr(settings, "GROQ_API_KEY", "")
        endpoint = "https://api.groq.com/openai/v1/chat/completions"
        models = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"]
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    else:
        api_key = getattr(settings, "OPENROUTER_API_KEY", "")
        endpoint = "https://openrouter.ai/api/v1/chat/completions"
        models = getattr(
            settings,
            "OPENROUTER_MODEL_CHAIN",
            ["x-ai/grok-4.1-fast", "google/gemini-2.5-flash", "openai/gpt-oss-120b"],
        )
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-Title": "KupasKontrak",
        }

    for model in models:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": raw_text},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
            }
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=45)
            resp.raise_for_status()
            data = resp.json()
            content_str = data["choices"][0]["message"]["content"]
            parsed_json = json.loads(content_str)
            return _parse_and_validate(parsed_json)
        except Exception as exc:
            last_error = exc
            continue

    raise AllModelsFailedError(
        f"All LLM models failed during analyze_contract. Last error: {last_error}"
    )


def ask_clause_question(clause_text: str, legal_ref: dict, question: str) -> str:
    provider = getattr(settings, "LLM_PROVIDER", "groq").lower()
    system_msg = (
        "Anda adalah asisten hukum AI KupasKontrak. Jawab pertanyaan pengguna HANYA berdasarkan konteks "
        "klausul kontrak berikut dan rujukan hukum yang disediakan. Jika informasi tidak ada pada klausul atau rujukan, "
        "sampaikan secara jujur bahwa informasi tidak cukup.\n\n"
        f"Klausul: {clause_text}\n"
        f"Rujukan Hukum: {json.dumps(legal_ref if legal_ref else {}, ensure_ascii=False)}"
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
                {"role": "user", "content": question},
            ],
            "temperature": 0.3,
        }
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        raise LLMGatewayError(f"Failed to answer clause question: {exc}")
