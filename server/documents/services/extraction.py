import io
import urllib.request
import fitz
import requests
from django.conf import settings
from documents.cloudinary_service import generate_signed_url


class OcrExtractionError(Exception):
    pass


class PdfSanitizationError(Exception):
    pass


def sanitize_pdf_bytes(file_bytes: bytes) -> bytes:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if hasattr(doc, "set_javascript"):
            doc.set_javascript("")
        if hasattr(doc, "set_open_action"):
            doc.set_open_action("")
        for page in doc:
            if hasattr(page, "get_links") and hasattr(page, "delete_link"):
                for link in list(page.get_links()):
                    page.delete_link(link)
            if hasattr(page, "annots") and hasattr(page, "delete_annot"):
                for annot in list(page.annots()):
                    page.delete_annot(annot)
            if hasattr(page, "widgets") and hasattr(page, "delete_widget"):
                for field in list(page.widgets()):
                    page.delete_widget(field)
        cleaned_bytes = doc.tobytes(garbage=4, deflate=True, clean=True)
        doc.close()
        return cleaned_bytes
    except Exception as e:
        raise PdfSanitizationError(f"PDF sanitization failed structurally: {e}")


def strip_pdf_threats(input_path: str, output_path: str) -> None:
    try:
        doc = fitz.open(input_path)
        if hasattr(doc, "set_javascript"):
            doc.set_javascript("")
        if hasattr(doc, "set_open_action"):
            doc.set_open_action("")
        for page in doc:
            if hasattr(page, "get_links") and hasattr(page, "delete_link"):
                for link in list(page.get_links()):
                    page.delete_link(link)
            if hasattr(page, "annots") and hasattr(page, "delete_annot"):
                for annot in list(page.annots()):
                    page.delete_annot(annot)
            if hasattr(page, "widgets") and hasattr(page, "delete_widget"):
                for field in list(page.widgets()):
                    page.delete_widget(field)
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
    except Exception as e:
        raise PdfSanitizationError(f"PDF sanitization failed structurally: {e}")


class OcrSpaceClient:
    endpoint = "https://api.ocr.space/parse/image"

    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        api_key = getattr(settings, "OCR_SPACE_API_KEY", "")
        if not api_key:
            raise OcrExtractionError("OCR_SPACE_API_KEY is not configured.")

        if len(file_bytes) <= 1024 * 1024:
            return self._send_request(file_bytes, filename, "application/pdf", "PDF")

        return self._extract_page_by_page(file_bytes, filename)

    def _send_request(self, file_data: bytes, filename: str, content_type: str, filetype: str) -> str:
        response = requests.post(
            self.endpoint,
            files={"file": (filename, file_data, content_type)},
            data={
                "apikey": getattr(settings, "OCR_SPACE_API_KEY", ""),
                "language": "ind",
                "OCREngine": 2,
                "isTable": True,
                "scale": True,
                "filetype": filetype,
            },
            timeout=60,
        )
        response.raise_for_status()
        result = response.json()
        if result.get("IsErroredOnProcessing"):
            error_msg = result.get("ErrorMessage", ["Unknown OCR error"])
            if isinstance(error_msg, list):
                error_msg = ", ".join(error_msg)
            raise OcrExtractionError(str(error_msg))
        parsed_results = result.get("ParsedResults", [])
        return "\n".join(page.get("ParsedText", "") for page in parsed_results if page.get("ParsedText"))

    def _extract_page_by_page(self, file_bytes: bytes, filename: str) -> str:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            img_bytes = pix.tobytes("jpeg")
            page_text = self._send_request(img_bytes, f"page_{page_num}.jpg", "image/jpeg", "JPG")
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts)


def _fetch_file_bytes(document) -> bytes:
    signed_url, _ = generate_signed_url(document.cloudinary_public_id, resource_type="raw", ttl_seconds=600)
    req = urllib.request.Request(signed_url, headers={"User-Agent": "KupasKontrak-Backend/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def extract(document, file_bytes: bytes = None) -> str:
    if file_bytes is None:
        file_bytes = _fetch_file_bytes(document)

    file_bytes = sanitize_pdf_bytes(file_bytes)
    doc_fitz = fitz.open(stream=file_bytes, filetype="pdf")
    native_text_parts = []
    for page in doc_fitz:
        native_text_parts.append(page.get_text())
    native_text = "\n".join(native_text_parts).strip()

    if len(native_text) >= 50:
        if hasattr(document, "source_type") and document.source_type != "native":
            document.source_type = "native"
            document.save(update_fields=["source_type"])
        return native_text

    ocr_client = OcrSpaceClient()
    scanned_text = ocr_client.extract_text(file_bytes, document.original_filename)
    if hasattr(document, "source_type") and document.source_type != "scanned":
        document.source_type = "scanned"
        document.save(update_fields=["source_type"])
    return scanned_text
