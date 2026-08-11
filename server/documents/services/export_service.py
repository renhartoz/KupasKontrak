import io
from docx import Document as DocxDocument
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
import cloudinary.uploader
from insights.models import GeneratedContractDraft

def upload_to_cloudinary(file_buffer, filename, resource_type="raw"):
    file_buffer.seek(0)
    response = cloudinary.uploader.upload(
        file_buffer,
        resource_type=resource_type,
        public_id=filename,
        use_filename=True,
        unique_filename=True
    )
    return response.get('public_id'), response.get('secure_url')


def generate_analysis_report_pdf(document):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    subtitle_style = styles['Heading2']
    normal_style = styles['Normal']
    
    elements = []
    
    # Title
    elements.append(Paragraph(f"Hasil Analisis Risiko: {document.original_filename}", title_style))
    elements.append(Spacer(1, 12))
    
    # Score
    score = document.overall_risk_score or 0
    risk_status = "Tinggi" if score >= 70 else ("Sedang" if score >= 40 else "Rendah")
    elements.append(Paragraph(f"Skor Risiko Keseluruhan: <b>{score}/100 ({risk_status})</b>", subtitle_style))
    elements.append(Spacer(1, 24))
    
    elements.append(Paragraph("Daftar Klausul Berisiko:", subtitle_style))
    elements.append(Spacer(1, 12))
    
    clauses = document.clauses.filter(clause_safety_score__gte=40).order_by('-clause_safety_score')
    
    if not clauses.exists():
        elements.append(Paragraph("Tidak ditemukan klausul berisiko sedang atau tinggi. Kontrak ini tergolong sangat aman.", normal_style))
    else:
        for c in clauses:
            status = "Kritis" if c.clause_safety_score >= 70 else "Sedang"
            elements.append(Paragraph(f"<b>[Risiko {status}] Kategori: {c.category}</b>", normal_style))
            elements.append(Paragraph(f"<i>Klausul Asli:</i> {c.clause_text}", normal_style))
            elements.append(Paragraph(f"<i>Catatan AI:</i> {c.plain_language_summary}", normal_style))
            if c.legal_reference:
                elements.append(Paragraph(f"<i>Referensi Hukum:</i> {c.legal_reference}", normal_style))
            elements.append(Spacer(1, 12))
            
    doc.build(elements)
    
    filename = f"report_{document.id}.pdf"
    public_id, secure_url = upload_to_cloudinary(buffer, filename, resource_type="raw")
    return secure_url


def generate_fixed_contract_docx(document):
    # Get the latest full_rewrite draft
    draft = document.drafts.filter(draft_type=GeneratedContractDraft.DraftType.FULL_REWRITE).order_by('-created_at').first()
    
    if not draft or not draft.content:
        raise ValueError("Draft 'full_rewrite' tidak ditemukan. Harap lakukan Auto-Fix terlebih dahulu.")
        
    content_json = draft.content
    
    docx = DocxDocument()
    
    # Set default font to Times New Roman, 12pt
    style = docx.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    
    # Title
    title_text = content_json.get("title", f"Revisi Kontrak: {document.original_filename}")
    heading = docx.add_heading(title_text, 0)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    sections = content_json.get("sections", [])
    
    for section in sections:
        section_title = section.get("section_title", "")
        content = section.get("content", "")
        
        if section_title:
            h2 = docx.add_heading(section_title, level=2)
            
        p = docx.add_paragraph(content)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
    # Disclaimer
    docx.add_page_break()
    disclaimer_p = docx.add_paragraph()
    disclaimer_p.add_run("DISCLAIMER: ").bold = True
    disclaimer_p.add_run(draft.disclaimer)
    disclaimer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    buffer = io.BytesIO()
    docx.save(buffer)
    
    filename = f"contract_{document.id}.docx"
    public_id, secure_url = upload_to_cloudinary(buffer, filename, resource_type="raw")
    return secure_url
