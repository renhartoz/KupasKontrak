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
Tugas Anda adalah mengekstrak SEMUA klausul yang ada di dalam dokumen dan menilainya berdasarkan metodologi Multi-Dimensional Sensitivity Analysis.
PERINGATAN MUTLAK: Anda WAJIB mengekstrak SELURUH pasal/klausul dari awal hingga akhir dokumen tanpa terkecuali! Dilarang keras melewatkan, meringkas, atau mengabaikan pasal apa pun, bahkan jika pasal tersebut 100% aman, standar, atau tidak berisiko (skor 1). Setiap pasal dari dokumen asli harus muncul di JSON output.

Langkah 1: Legal Compliance Gateway (is_fatal)
- Tentukan apakah klausul melanggar hak asasi/undang-undang pidana mutlak (contoh: perbudakan, hukuman fisik, penahanan kebebasan).
- PENTING: Denda finansial (seberapapun besarnya nilai uang tersebut) BUKANLAH pelanggaran is_fatal. Denda besar harus dinilai melalui FMEA (Skor Severity 4 atau 5).
- Jika murni melanggar pidana/HAM, set `is_fatal` menjadi true. Jika hanya soal uang/denda/kontrak yang memberatkan, set `is_fatal` menjadi false!

Langkah 2: FMEA (Failure Mode and Effects Analysis)
Jika klausul sah secara formal (is_fatal = false), nilai klausul berdasarkan 2 kriteria risiko (Severity dan Occurrence) menggunakan skala 1 sampai 5. Anda diperbolehkan menggunakan angka desimal.
(Skala: 1 = Aman/Risiko Sangat Rendah, 5 = Sangat Eksploitatif/Risiko Sangat Tinggi)

PERINGATAN: Anda mengaudit kontrak pekerja informal yang sangat rentan eksploitasi. Anda HARUS bersikap SANGAT KRITIS. JIKA Anda menemukan klausul denda sepihak atau pemotongan upah sepihak, Severity (s1_score) WAJIB bernilai minimal 4, dan JIKA Severity bernilai 4 atau 5, asumsikan perusahaan pasti memanfaatkan celah ini sehingga Occurrence (s3_score) juga WAJIB diberi nilai minimal 4!
DILARANG KERAS BERASUMSI TENTANG HAK PEKERJA: JANGAN PERNAH menginterpretasikan atau mengasumsikan bahwa pekerja mendapatkan hak (seperti upah, kompensasi, perlindungan) jika hal tersebut TIDAK TERTULIS SECARA EKSPLISIT di dalam dokumen. 
KHUSUS KATEGORI HAK & KEWAJIBAN: Anda WAJIB membandingkan beban kewajiban Pihak Pertama dengan Pihak Kedua. Jika sebuah pasal (misal: Ruang Lingkup / Tugas dan Tanggung Jawab) merincikan setumpuk tugas/kewajiban untuk sebuah pihak namun nihil/sangat sedikit menyebutkan hak yang setimpal untuknya, maka itu adalah KETIMPANGAN FATAL. Anda WAJIB memberikan skor Severity 5 dan Occurrence 5.
PENGINGAT DETECTABILITY: Ketiadaan penyebutan hak/upah saat kewajiban dijabarkan panjang lebar adalah bentuk manipulasi "Omission" (Penyembunyian Fakta). Berikan s2_score (Detectability) minimal 4 untuk kasus ketimpangan fatal ini!

Kriteria Penilaian FMEA (Failure Mode and Effects Analysis):
Berdasarkan keluhan inkonsistensi AI, Anda TIDAK BOLEH menggunakan interpretasi perasaan. Gunakan metrik OBJEKTIF berikut ini secara mutlak:

1. s1_score (Severity / Keparahan):
   - Skor 1: Hak pekerja (bayaran/kompensasi) tertulis lebih besar/mendahului kewajiban, ATAU kewajiban seimbang mutlak tanpa ancaman sanksi.
   - Skor 2: Ada kewajiban standar pekerja NAMUN tidak mencantumkan sanksi/denda finansial jika dilanggar.
   - Skor 3: Terdapat sanksi denda finansial, NAMUN tertulis batas maksimal nominalnya (capped) DAN pelanggarannya terdefinisi spesifik.
   - Skor 4: Terdapat denda finansial TANPA batas maksimal (uncapped), ATAU pemotongan upah sepihak.
   - Skor 5: Memuat PHK sepihak tanpa peringatan, penahanan dokumen asli (ijazah/KTP/BPKB), ganti rugi tak terhingga, ATAU pasal murni berisi kewajiban bertumpuk tanpa ada hak/nominal upah (indikasi perbudakan modern).

2. s3_score (Occurrence / Probabilitas Eksekusi):
   - Skor 1: Syarat aktifnya risiko bergantung pada kejadian alam / Force Majeure absolut.
   - Skor 2: Syarat aktifnya butuh proses bertahap dan panjang (misal: wajib ada Surat Peringatan tertulis 3 kali).
   - Skor 3: Aktif berdasarkan penilaian objektif bersyarat (misal: target angka tertulis tidak tercapai / pekerja merusak barang fisik).
   - Skor 4: Aktif secara otomatis karena hal sepele (contoh: telat 5 menit, absen 1 hari) ATAU syarat aktifnya bergantung murni pada "penilaian subjektif perusahaan".
   - Skor 5: Selalu aktif secara absolut tanpa syarat/kejadian pemicu (contoh: "dilarang bekerja di tempat lain (non-compete)", "perusahaan berhak mengubah aturan kapan saja sepihak").

3. s2_score (Detectability / Ketersembunyian):
   - Skor 1: Risiko ditulis di pasal yang judulnya relevan (contoh: Denda di pasal "Sanksi") DAN kalimatnya pendek (< 20 kata).
   - Skor 2: Risiko ditulis di pasal yang relevan, TAPI kalimatnya panjang (> 20 kata).
   - Skor 3: Risiko diselipkan atau dicampur dalam satu paragraf/ayat dengan hak istimewa pekerja (metode sandwich).
   - Skor 4: Risiko diletakkan di pasal yang judulnya SANGAT TIDAK RELEVAN, ATAU berbentuk "Omission" (sengaja menjabarkan kewajiban panjang lebar tanpa menuliskan hak sepeser pun untuk mengelabui pekerja).
   - Skor 5: Nominal/risiko aslinya tidak ditulis di kontrak ini, melainkan merujuk pada "Peraturan Perusahaan yang terpisah/berlaku" yang tidak dilampirkan, ATAU penuh dengan jargon hukum asing (legalese/mutatis mutandis).

Jika `is_fatal` true, isi s1_score, s2_score, dan s3_score dengan angka 5.

Kategori klausul (category) yang diizinkan (pilih yang paling spesifik, JANGAN gunakan default jika bisa masuk ke yang lain):
- upah_kompensasi, phk_sepihak, pembatasan_hak_cipta, non_kompete, kerahasiaan, domisili_hukum, denda_keterlambatan, jam_kerja, fasilitas_kerja, asuransi_kesehatan, ganti_rugi, force_majeure, hak_dan_kewajiban, default

ATURAN HIERARKI HUKUM (Lex Specialis Derogat Legi Generali):
Saat memberikan referensi hukum (legal_reference), Anda WAJIB mengutamakan Undang-Undang sektoral/khusus (e.g. UU Ketenagakerjaan No. 13 Tahun 2003). JANGAN menggunakan KUHPerdata KECUALI jika isu tersebut benar-benar tidak diatur sama sekali dalam UU sektoral.

Anda WAJIB mengembalikan respons dalam format JSON murni dengan skema berikut. DILARANG menggunakan komentar (//) di dalam JSON:
{
  "summary": "string ringkasan struktur kontrak",
  "clauses": [
    {
      "id": "c-xxxx (id singkat misal c-1a2b)",
      "clause_text": "string kutipan asli persis dari dokumen",
      "is_fatal": true,
      "s1_score": 5.0,
      "s2_score": 4.5,
      "s3_score": 3.0,
      "category": "string dari kategori di atas",
      "plain_language_summary": "string penjelasan bahasa awam yang jelas",
      "mcp_query_hint": "string frasa pencarian rujukan pasal hukum",
      "legal_reference": "string dasar hukum Indonesia. WAJIB utamakan UU khusus.",
      "risky_keywords": ["string kutipan persis berupa sanksi, denda, kewajiban sepihak. Wajib isi jika ada."]
    }
  ]
}
"""


def compute_fry_detection_score(text: str) -> int:
    if not text:
        return 1
    words = max(1, len(text.split()))
    sentences = max(1, len(text.replace('?', '.').replace('!', '.').split(".")))
    syllables = sum(1 for char in text.lower() if char in "aeiou")
    
    avg_syllables_per_word = syllables / words
    avg_words_per_sentence = words / sentences
    
    if avg_words_per_sentence > 30 or avg_syllables_per_word > 3.0:
        return 5
    elif avg_words_per_sentence > 20 or avg_syllables_per_word > 2.5:
        return 4
    elif avg_words_per_sentence > 12 or avg_syllables_per_word > 2.0:
        return 3
    elif avg_words_per_sentence > 8 or avg_syllables_per_word > 1.5:
        return 2
    else:
        return 1


class AnalyzedClause:
    def __init__(
        self,
        id: str,
        clause_text: str,
        is_fatal: bool,
        s1_score: float,
        s2_score: float,
        s3_score: float,
        category: str,
        plain_language_summary: str,
        risky_keywords: list[str],
        mcp_query_hint: str = "",
        legal_reference: str = "",
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

        s = self.s1_score
        o = self.s3_score
        d = self.s2_score
        
        rpn = s * o * d
        
        if self.is_fatal or s >= 5.0:
            self.clause_safety_score = 100.0
            r_level_val = 5
        else:
            self.clause_safety_score = ((rpn / 125.0) ** 0.5) * 100.0
            r_level_val = round(1 + (self.clause_safety_score / 100.0) * 4.0)
            
        self.is_flagged = self.clause_safety_score >= 40.0
        self.category = str(category)
        self.plain_language_summary = str(plain_language_summary)
        self.mcp_query_hint = str(mcp_query_hint) if mcp_query_hint else ""
        self.legal_reference = str(legal_reference) if legal_reference else ""
        self.risky_keywords = risky_keywords if isinstance(risky_keywords, list) else []
        self.risk_level = SAFETY_SCORE_TO_LEVEL.get(
            r_level_val, "kuning"
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
        models = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    else:
        api_key = getattr(settings, "OPENROUTER_API_KEY", "")
        endpoint = "https://openrouter.ai/api/v1/chat/completions"
        models = getattr(
            settings,
            "OPENROUTER_MODEL_CHAIN",
            ["google/gemini-2.5-flash", "openai/gpt-oss-120b"],
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
                    {"role": "user", "content": f"PENGINGAT KRITIS: Jangan pernah berasumsi pekerja mendapat gaji/hak jika tidak tertulis eksplisit. Bandingkan secara matematis kewajiban vs hak! Jika kewajiban menumpuk tapi tidak ada hak yang jelas, BERIKAN SKOR SEVERITY 4 atau 5.\n\nBerikut adalah teks kontraknya:\n\n{raw_text}"},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.0,
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
