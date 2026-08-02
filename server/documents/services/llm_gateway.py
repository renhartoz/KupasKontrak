import json
import requests
from django.conf import settings


class LLMGatewayError(Exception):
    pass


class AllModelsFailedError(LLMGatewayError):
    pass


SAFETY_SCORE_TO_LEVEL = {
    1: "hijau_tua",
    2: "hijau_muda",
    3: "kuning",
    4: "merah_muda",
    5: "merah_tua",
}

SYSTEM_PROMPT = """Anda adalah KupasKontrak AI, asisten audit kontrak bahasa Indonesia yang menganalisis klausul perjanjian kerja untuk pekerja informal.
Tugas Anda adalah mengekstrak semua klausul penting dalam dokumen dan menilainya berdasarkan metodologi Multi-Dimensional Sensitivity Analysis.

Langkah 1: Legal Compliance Gateway (is_fatal)
- Tentukan apakah klausul melanggar undang-undang positif Indonesia secara mutlak (Ilegal).
- Jika Ilegal, set `is_fatal` menjadi true.

Langkah 2: Weighted Asymmetry Assessment
Jika klausul sah secara formal (is_fatal = false), nilai klausul berdasarkan 3 kriteria risiko menggunakan skala 1 sampai 5. Anda diperbolehkan menggunakan angka desimal (contoh: 3.5, 4.2) jika risikonya berada di antara dua skor bulat.
(Skala: 1 = Sangat Seimbang/Aman, 5 = Sangat Eksploitatif/Tidak Adil/Berbahaya)

PERINGATAN: Anda mengaudit kontrak pekerja informal yang sangat rentan eksploitasi. Anda HARUS bersikap SANGAT KRITIS menggunakan Rubrik Baku berikut.
JIKA Anda menemukan klausul berbahaya (misalnya: denda sepihak, sanksi berat, pemotongan upah sepihak) yang pantas mendapat skor 4 atau 5 pada S1, maka Anda WAJIB memberikan skor minimal 4 juga pada S2 dan S3! (Anggaplah denda sepihak itu tidak pernah wajar (S3) dan tidak bisa dibenarkan oleh transparansi (S2), sehingga skor rata-ratanya tidak akan jatuh).
ASUMSI DOKUMEN TUNGGAL: Anggap saja belum ada surat perjanjian/dokumen lain sebelumnya bila tidak disebutkan secara tertulis. Jika sebuah surat atau klausul HANYA membahas kewajiban bagi PIHAK KEDUA (Pekerja) tanpa memberikan hak yang setimpal di dalamnya, NILAI SEBAGAI BERBAHAYA (Skor 4 atau 5). Jangan pernah berasumsi bahwa hak pekerja diatur di dokumen lain!
- Skor 1 (Sangat Aman): Hak dan kewajiban sangat seimbang. Menguntungkan pihak pekerja. Transparansi penuh.
- Skor 2 (Batas Wajar): Praktik standar industri. Sedikit miring ke perusahaan tetapi masih sesuai koridor hukum umum.
- Skor 3 (Peringatan Dini): Ada ambiguitas yang berpotensi merugikan (contoh: denda tidak spesifik, jam kerja tidak jelas).
- Skor 4 (Berbahaya): Jelas merugikan pekerja (contoh: sanksi sepihak, denda sepihak bagi pekerja, pemotongan upah sepihak).
- Skor 5 (Eksploitatif/Ilegal): Menghilangkan hak asasi pekerja, melanggar undang-undang mutlak (contoh: menahan ijazah, denda di luar batas kewajaran, pemecatan tanpa hak).

Kriteria S1, S2, S3:
- S1 (Keseimbangan Hak & Sanksi): Apakah hak dan sanksi terdistribusi adil?
- S2 (Transparansi Parameter Finansial): Apakah nominal, denda, atau kompensasi ditulis transparan?
- S3 (Batas Kewajaran Industri): Apakah klausul ini umum dan wajar di industri pekerja informal?
Jika `is_fatal` true, isi S1, S2, dan S3 dengan 5.

Kategori klausul (category) yang diizinkan (pilih yang paling spesifik, JANGAN gunakan default jika bisa masuk ke yang lain):
- upah_kompensasi, phk_sepihak, pembatasan_hak_cipta, non_kompete, kerahasiaan, domisili_hukum, denda_keterlambatan, jam_kerja, fasilitas_kerja, asuransi_kesehatan, ganti_rugi, force_majeure, hak_dan_kewajiban, default

Anda WAJIB mengembalikan respons dalam format JSON murni dengan skema berikut:
{
  "summary": "string ringkasan struktur kontrak",
  "clauses": [
    {
      "id": "c-xxxx (id singkat misal c-1a2b)",
      "clause_text": "string kutipan asli persis dari dokumen",
      "is_fatal": boolean (true jika melanggar hukum mutlak),
      "s1_score": number (1-5, bisa desimal),
      "s2_score": number (1-5, bisa desimal),
      "s3_score": number (1-5, bisa desimal),
      "category": "string dari kategori di atas",
      "plain_language_summary": "string penjelasan bahasa awam yang jelas",
      "mcp_query_hint": "string frasa pencarian rujukan pasal hukum",
      "legal_reference": "string spesifik dasar hukum Indonesia yang melandasi penilaian (misal: 'Pasal 62 UU Ketenagakerjaan No. 13 Tahun 2003', 'Pasal 1320 KUHPerdata')",
      "risky_keywords": ["string kutipan persis dari clause_text berupa sanksi, denda, atau kewajiban sepihak"] // WAJIB DIISI jika ada unsur yang memberatkan pekerja, sekecil apapun.
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
        legal_reference=None,
        risky_keywords=None,
        **kwargs
    ):
        self.id = str(id)
        self.clause_text = str(clause_text)
        self.is_fatal = bool(is_fatal)
        
        def parse_score(val):
            try:
                v = float(val)
                return max(1.0, min(5.0, round(v, 2)))
            except (ValueError, TypeError):
                return 3.0
                
        self.s1_score = parse_score(s1_score)
        self.s2_score = parse_score(s2_score)
        self.s3_score = parse_score(s3_score)
        
        # Calculate intermediate clause_safety_score based on Weighted Average (SAW)
        if self.is_fatal:
            self.clause_safety_score = 100.0
            raw_score = 5.0
        else:
            raw_score = (self.s1_score * 0.45) + (self.s2_score * 0.35) + (self.s3_score * 0.20)
            self.clause_safety_score = ((raw_score - 1) / 4.0) * 100.0
            
        self.is_flagged = self.clause_safety_score >= 60.0
        self.category = str(category)
        self.plain_language_summary = str(plain_language_summary)
        self.mcp_query_hint = str(mcp_query_hint) if mcp_query_hint else ""
        self.legal_reference = str(legal_reference) if legal_reference else ""
        self.risky_keywords = risky_keywords if isinstance(risky_keywords, list) else []
        self.risk_level = SAFETY_SCORE_TO_LEVEL.get(
            round((raw_score if not self.is_fatal else 5)), "kuning"
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
            "legal_reference": self.legal_reference,
            "risky_keywords": self.risky_keywords,
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
        analyzed.append(
            AnalyzedClause(
                id=c_id,
                clause_text=clause_text,
                is_fatal=item.get("is_fatal", False),
                s1_score=item.get("s1_score", 3),
                s2_score=item.get("s2_score", 3),
                s3_score=item.get("s3_score", 3),
                category=item.get("category", "default"),
                plain_language_summary=item.get(
                    "plain_language_summary", clause_text
                ),
                mcp_query_hint=item.get("mcp_query_hint", ""),
                legal_reference=item.get("legal_reference", ""),
                risky_keywords=item.get("risky_keywords", []),
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
            if resp.status_code != 200:
                last_error = f"HTTP {resp.status_code}: {resp.text}"
                continue
                
            data = resp.json()
            content_str = data["choices"][0]["message"]["content"]
            parsed_json = json.loads(content_str)
            return _parse_and_validate(parsed_json)
        except Exception as exc:
            last_error = f"Exception: {str(exc)}"
            continue

    raise AllModelsFailedError(
        f"All LLM models failed during analyze_contract. Last error: {last_error}"
    )


def ask_clause_question(clause_text: str, legal_ref: dict, question: str, full_document_text: str = "", history: list = None) -> str:
    provider = getattr(settings, "LLM_PROVIDER", "groq").lower()
    system_msg = (
        "Anda adalah asisten hukum AI KupasKontrak. Jawab pertanyaan pengguna berdasarkan konteks "
        "klausul saat ini dan keseluruhan teks dokumen kontrak yang disediakan.\n\n"
        f"Klausul Spesifik:\n{clause_text}\n\n"
        f"Konteks Keseluruhan Dokumen:\n{full_document_text}\n\n"
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

    messages = [{"role": "system", "content": system_msg}]
    if history:
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})

    try:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
        }
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        raise LLMGatewayError(f"Failed to answer clause question: {exc}")

def ask_clause_question_stream(clause_text: str, legal_ref: dict, question: str, full_document_text: str = "", history: list = None):
    provider = getattr(settings, "LLM_PROVIDER", "groq").lower()
    system_msg = (
        "Anda adalah asisten hukum AI KupasKontrak. Jawab pertanyaan pengguna berdasarkan konteks "
        "klausul saat ini dan keseluruhan teks dokumen kontrak yang disediakan.\n\n"
        f"Klausul Spesifik:\n{clause_text}\n\n"
        f"Konteks Keseluruhan Dokumen:\n{full_document_text}\n\n"
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

    messages = [{"role": "system", "content": system_msg}]
    if history:
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "stream": True
    }
    
    try:
        with requests.post(endpoint, headers=headers, json=payload, stream=True, timeout=30) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith("data: "):
                        content = decoded[6:]
                        if content == "[DONE]":
                            break
                        try:
                            chunk = json.loads(content)
                            delta = chunk["choices"][0].get("delta", {})
                            if "content" in delta:
                                yield delta["content"]
                        except json.JSONDecodeError:
                            pass
    except Exception as exc:
        yield f"\n[Error: {exc}]"
