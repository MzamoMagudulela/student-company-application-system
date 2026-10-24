import io
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

# Brand colors
COLOR_PRIMARY_NAVY = colors.HexColor("#142B4A")
COLOR_TEAL = colors.HexColor("#0F9D8A")
COLOR_TEXT_PRIMARY = colors.HexColor("#243247")
COLOR_TEXT_SECONDARY = colors.HexColor("#64748B")
COLOR_BORDER = colors.HexColor("#E2E8F0")
COLOR_LIGHT_BG = colors.HexColor("#F4F7FB")

def generate_cv_pdf(data: dict) -> bytes:
    """
    Generates a clean, professional ATS-friendly CV PDF from structured student builder data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    name_style = ParagraphStyle(
        'CVName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=COLOR_PRIMARY_NAVY,
        alignment=TA_LEFT
    )

    headline_style = ParagraphStyle(
        'CVHeadline',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=COLOR_TEAL,
        alignment=TA_LEFT
    )

    contact_style = ParagraphStyle(
        'CVContact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=COLOR_TEXT_SECONDARY,
        alignment=TA_LEFT
    )

    section_heading = ParagraphStyle(
        'CVSectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=COLOR_PRIMARY_NAVY,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'CVBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=COLOR_TEXT_PRIMARY,
        alignment=TA_JUSTIFY
    )

    bullet_style = ParagraphStyle(
        'CVBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=COLOR_TEXT_PRIMARY,
        leftIndent=12
    )

    story = []

    # Header Name & Headline
    full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or "Student Candidate"
    story.append(Paragraph(full_name, name_style))
    if data.get('headline'):
        story.append(Spacer(1, 2))
        story.append(Paragraph(data['headline'], headline_style))

    # Contact Line
    contact_parts = []
    if data.get('email'):
        contact_parts.append(f"Email: {data['email']}")
    if data.get('phone_number'):
        contact_parts.append(f"Phone: {data['phone_number']}")
    if data.get('location'):
        contact_parts.append(f"Location: {data['location']}")

    if contact_parts:
        story.append(Spacer(1, 4))
        story.append(Paragraph(" &bull; ".join(contact_parts), contact_style))

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_TEAL, spaceBefore=2, spaceAfter=8))

    # Professional Summary
    if data.get('summary') or data.get('bio'):
        summary_text = data.get('summary') or data.get('bio')
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_heading))
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 8))

    # Education
    story.append(Paragraph("EDUCATION & QUALIFICATIONS", section_heading))
    institution = data.get('institution', 'Accredited Tertiary Institution')
    field_of_study = data.get('field_of_study', 'Degree / Diploma')
    grad_year = data.get('graduation_year', 'Current')

    edu_title = f"<b>{field_of_study}</b> — {institution} ({grad_year})"
    story.append(Paragraph(edu_title, body_style))
    if data.get('education_details'):
        story.append(Spacer(1, 2))
        story.append(Paragraph(data['education_details'], bullet_style))
    story.append(Spacer(1, 8))

    # Skills
    skills_list = data.get('skills', [])
    if isinstance(skills_list, list) and skills_list:
        story.append(Paragraph("KEY SKILLS & COMPETENCIES", section_heading))
        formatted_skills = ", ".join(str(s) for s in skills_list)
        story.append(Paragraph(formatted_skills, body_style))
        story.append(Spacer(1, 8))

    # Projects
    projects = data.get('projects', [])
    if projects and isinstance(projects, list):
        story.append(Paragraph("ACADEMIC & PRACTICAL PROJECTS", section_heading))
        for p in projects:
            title = p.get('title', 'Project')
            tech = p.get('technologies', '')
            desc = p.get('description', '')
            header = f"<b>{title}</b>" + (f" | <i>{tech}</i>" if tech else "")
            story.append(Paragraph(header, body_style))
            if desc:
                story.append(Paragraph(f"&bull; {desc}", bullet_style))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 4))

    # Work / Volunteer Experience (if any)
    experience = data.get('experience', [])
    if experience and isinstance(experience, list):
        story.append(Paragraph("EXPERIENCE & LEADERSHIP", section_heading))
        for exp in experience:
            role = exp.get('role', 'Intern / Assistant')
            org = exp.get('organization', '')
            period = exp.get('period', '')
            desc = exp.get('description', '')
            header = f"<b>{role}</b> — {org} ({period})"
            story.append(Paragraph(header, body_style))
            if desc:
                story.append(Paragraph(f"&bull; {desc}", bullet_style))
            story.append(Spacer(1, 4))

    doc.build(story)
    return buffer.getvalue()

def generate_offer_letter_pdf(offer_data: dict) -> bytes:
    """
    Generates a formal, enterprise-grade PDF Offer Letter.
    Includes brand identity, official offer reference, student details,
    terms and conditions, start dates, response deadline, and signature blocks.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    header_brand_style = ParagraphStyle(
        'OfferBrand',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=COLOR_PRIMARY_NAVY,
        alignment=TA_LEFT
    )

    header_sub_style = ParagraphStyle(
        'OfferSubBrand',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=COLOR_TEXT_SECONDARY,
        alignment=TA_LEFT
    )

    offer_title_style = ParagraphStyle(
        'OfferDocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=COLOR_PRIMARY_NAVY,
        alignment=TA_CENTER,
        spaceBefore=12,
        spaceAfter=12
    )

    meta_label_style = ParagraphStyle(
        'OfferMetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=COLOR_PRIMARY_NAVY
    )

    meta_val_style = ParagraphStyle(
        'OfferMetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=COLOR_TEXT_PRIMARY
    )

    body_style = ParagraphStyle(
        'OfferBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=COLOR_TEXT_PRIMARY,
        alignment=TA_JUSTIFY,
        spaceAfter=8
    )

    terms_style = ParagraphStyle(
        'OfferTerms',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=COLOR_TEXT_PRIMARY,
        alignment=TA_JUSTIFY
    )

    story = []

    # Brand Header Table
    brand_p = Paragraph("<b>MZAMO'S YOUTH DEVELOPMENT COMPANY</b>", header_brand_style)
    brand_sub = Paragraph("Student Company Application System &bull; Talent Acquisition<br/>Your Skills. Your Opportunity. Your Future.", header_sub_style)
    ref_p = Paragraph(f"<b>Offer Ref:</b> {offer_data.get('offer_reference', 'OFFER-REF')}<br/><b>Date of Issue:</b> {offer_data.get('issue_date', datetime.now().strftime('%d %B %Y'))}", meta_val_style)

    header_table = Table(
        [[[brand_p, brand_sub], ref_p]],
        colWidths=[330, 180]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(header_table)

    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_TEAL, spaceBefore=4, spaceAfter=14))

    # Document Title
    story.append(Paragraph("FORMAL OFFER OF EMPLOYMENT / INTERNSHIP", offer_title_style))

    # Recipient & Opportunity Details Table
    student_name = offer_data.get('student_name', 'Valued Candidate')
    opportunity_title = offer_data.get('opportunity_title', 'Internship Opportunity')
    company_name = offer_data.get('company_name', 'Host Partner Company')
    response_deadline = offer_data.get('response_deadline', 'Within 7 business days')
    start_date = offer_data.get('start_date', 'To be mutually scheduled')
    stipend = offer_data.get('salary_stipend', 'Competitive standard market stipend')

    details_data = [
        [Paragraph("Candidate Name:", meta_label_style), Paragraph(student_name, meta_val_style)],
        [Paragraph("Position Offered:", meta_label_style), Paragraph(opportunity_title, meta_val_style)],
        [Paragraph("Host Organization:", meta_label_style), Paragraph(company_name, meta_val_style)],
        [Paragraph("Commencement Date:", meta_label_style), Paragraph(start_date, meta_val_style)],
        [Paragraph("Response Deadline:", meta_label_style), Paragraph(response_deadline, meta_val_style)],
        [Paragraph("Remuneration / Stipend:", meta_label_style), Paragraph(stipend, meta_val_style)],
    ]

    details_table = Table(details_data, colWidths=[150, 360])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, COLOR_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 14))

    # Opening Paragraph
    story.append(Paragraph(
        f"Dear {student_name},<br/><br/>"
        f"On behalf of <b>{company_name}</b> and Mzamo's Youth Development Company, we are delighted to formally extend this offer of appointment for the position of <b>{opportunity_title}</b>. Following our rigorous assessment and review of your application, we were thoroughly impressed by your qualifications, competence, and potential for growth.",
        body_style
    ))

    # Terms & Conditions Section
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Terms and Conditions of Appointment:</b>", meta_label_style))
    story.append(Spacer(1, 4))
    terms_text = offer_data.get('terms_and_conditions', '').strip()
    if not terms_text:
        terms_text = (
            "1. Duties & Responsibilities: You will perform tasks associated with your programme under professional mentorship.\n"
            "2. Confidentiality: All intellectual property and host company data remain strictly confidential.\n"
            "3. Code of Conduct: Adherence to workplace safety, ethics, and professional standards is mandatory.\n"
            "4. Acceptance: Please record your decision through the Student Company Application System portal before the specified deadline."
        )

    for line in terms_text.split('\n'):
        if line.strip():
            story.append(Paragraph(line.strip(), terms_style))
            story.append(Spacer(1, 3))

    story.append(Spacer(1, 14))

    # Signature Block
    sig_data = [
        [
            Paragraph("<b>Issued On Behalf of Management:</b><br/><br/><i>Mzamo Sandile Magudulela</i><br/>Managing Director & Developer<br/>Mzamo's Youth Development Company", meta_val_style),
            Paragraph("<b>Candidate Acceptance Signature:</b><br/><br/>____________________________________<br/>Date: ________________________<br/>Portal Status: Electronic Verification", meta_val_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[255, 255])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(KeepTogether(sig_table))

    doc.build(story)
    return buffer.getvalue()
