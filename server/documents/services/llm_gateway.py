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
Tugas Anda adalah mengekstrak semua klausul penting dalam dokumen dan menilainya berdasarkan metodologi Multi-Dimensional Sensitivity Analysis.

Langkah 1: Legal Compliance Gateway (is_fatal)
- Tentukan apakah klausul melanggar undang-undang positif Indonesia secara mutlak (Ilegal).
- Jika Ilegal, set `is_fatal` menjadi true.

Langkah 2: Weighted Asymmetry Assessment
Jika klausul sah secara formal (is_fatal = false), nilai klausul berdasarkan 3 kriteria risiko menggunakan skala 1 sampai 5.
(Skala: 5 = Sangat Seimbang/Adil/Aman, 1 = Sangat Eksploitatif/Tidak Adil)
- S1 (Keseimbangan Hak & Sanksi): Apakah hak dan sanksi terdistribusi adil?
- S2 (Transparansi Parameter Finansial): Apakah nominal, denda, atau kompensasi ditulis transparan?
- S3 (Batas Kewajaran Industri): Apakah klausul ini umum dan wajar di industri pekerja informal?
Jika `is_fatal` true, isi S1, S2, dan S3 dengan 1.

Kategori klausul (category) yang diizinkan:
- upah_kompensasi, phk_sepihak, pembatasan_hak_cipta, non_kompete, kerahasiaan, domisili_hukum, default

Anda WAJIB mengembalikan respons dalam format JSON murni dengan skema berikut:
{
  "summary": "string ringkasan struktur kontrak",
  "clauses": [
    {
      "id": "c-xxxx (id singkat misal c-1a2b)",
      "clause_text": "string kutipan asli persis dari dokumen",
      "is_fatal": boolean (true jika melanggar hukum mutlak),
      "s1_score": int (1-5),
      "s2_score": int (1-5),
      "s3_score": int (1-5),
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
        is_fatal,
        s1_score,
        s2_score,
        s3_score,
        category,
        plain_language_summary,
        mcp_query_hint,
        **kwargs
    ):
        self.id = str(id)
        self.clause_text = str(clause_text)
        self.is_fatal = bool(is_fatal)
        
        def parse_score(val):
            try:
                v = int(val)
                return max(1, min(5, v))
            except (ValueError, TypeError):
                return 3
                
        self.s1_score = parse_score(s1_score)
        self.s2_score = parse_score(s2_score)
        self.s3_score = parse_score(s3_score)
        
        # Calculate intermediate clause_safety_score based on SAW
        if self.is_fatal:
            self.clause_safety_score = 1.0
        else:
            self.clause_safety_score = (self.s1_score * 0.45) + (self.s2_score * 0.35) + (self.s3_score * 0.20)
            
        self.is_flagged = self.clause_safety_score <= 3.0
        self.category = str(category)
        self.plain_language_summary = str(plain_language_summary)
        self.mcp_query_hint = str(mcp_query_hint)
        self.risk_level = SAFETY_SCORE_TO_LEVEL.get(
            round(self.clause_safety_score), "kuning"
        )

    def to_event_payload(self) -> dict:
        return {
            "clause_id": self.id,
            "clause_text": self.clause_text,
            "is_fatal": self.is_fatal,
            "s1_score": self.s1_score,
            "s2_score": self.s2_score,
            "s3_score": self.s3_score,
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
