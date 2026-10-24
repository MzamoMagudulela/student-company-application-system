import re
from pathlib import Path
from typing import Dict, Any, List, Tuple
from pypdf import PdfReader
import docx

def validate_cv_file(file_bytes: bytes, filename: str) -> Tuple[bool, str, str]:
    """
    Validates file size (max 5MB), extension, and magic bytes for PDF and DOCX.
    Returns (is_valid, error_message, mime_type).
    """
    max_size = 5 * 1024 * 1024  # 5MB
    if len(file_bytes) > max_size:
        return False, "File exceeds maximum permitted size of 5MB.", ""

    ext = Path(filename).suffix.lower()
    if ext not in [".pdf", ".docx"]:
        return False, "Only PDF (.pdf) and Word (.docx) documents are permitted.", ""

    # Check magic bytes
    if ext == ".pdf":
        if not file_bytes.startswith(b"%PDF-"):
            return False, "File header does not match valid PDF format.", ""
        return True, "", "application/pdf"
    elif ext == ".docx":
        # ZIP magic bytes PK\x03\x04
        if not file_bytes.startswith(b"PK\x03\x04"):
            return False, "File header does not match valid DOCX format.", ""
        return True, "", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return False, "Unsupported file format.", ""

def extract_text_from_file(file_path: Path, mime_type: str) -> str:
    """Extracts text content safely from PDF or DOCX file."""
    text_content = []
    try:
        if "pdf" in mime_type:
            reader = PdfReader(str(file_path))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_content.append(extracted)
        elif "word" in mime_type or "docx" in mime_type:
            doc = docx.Document(str(file_path))
            for para in doc.paragraphs:
                if para.text:
                    text_content.append(para.text)
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
    return "\n".join(text_content)

def analyze_cv_content(text: str) -> Dict[str, Any]:
    """
    Performs transparent, fair CV readiness diagnosis.
    Does NOT penalize students or graduates for lacking formal corporate employment.
    Rewards academic projects, relevant coursework, skills, and clear formatting.
    """
    lower = text.lower()
    checklist = {}
    strengths = []
    missing_sections = []
    recommendations = []
    score = 0

    # 1. Contact Information (Email & Phone)
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text))
    has_phone = bool(re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', text))
    checklist["contact_info"] = {
        "passed": has_email and has_phone,
        "email_found": has_email,
        "phone_found": has_phone,
        "description": "Professional email address and contact telephone number."
    }
    if has_email and has_phone:
        score += 15
        strengths.append("Complete and clear contact details (email and telephone).")
    else:
        missing_sections.append("Contact Information")
        recommendations.append("Ensure your mobile phone number and professional email are prominently displayed at the top.")

    # 2. Professional Summary / Career Objective
    has_summary = any(kw in lower for kw in ["summary", "objective", "profile", "about me", "personal statement"])
    checklist["summary"] = {
        "passed": has_summary,
        "description": "Succinct career objective or professional summary."
    }
    if has_summary:
        score += 15
        strengths.append("Clear career summary or personal profile highlighting motivation.")
    else:
        missing_sections.append("Professional Summary")
        recommendations.append("Add a 2-3 sentence career objective outlining your field of study and the opportunity you seek.")

    # 3. Education & Academic Background
    has_education = any(kw in lower for kw in [
        "education", "academic", "degree", "diploma", "bachelor", "matric", "university",
        "college", "institute", "faculty", "gpa", "coursework"
    ])
    checklist["education"] = {
        "passed": has_education,
        "description": "Academic qualifications, institution name, and graduation year."
    }
    if has_education:
        score += 20
        strengths.append("Comprehensive academic qualifications section detailing your institution and studies.")
    else:
        missing_sections.append("Education & Qualifications")
        recommendations.append("Highlight your educational history, qualification title, institution, and expected graduation year.")

    # 4. Technical & Soft Skills
    has_skills = any(kw in lower for kw in ["skills", "technologies", "competencies", "tools", "proficiencies", "programming"])
    skill_keywords_count = sum(1 for kw in [
        "python", "javascript", "react", "html", "css", "sql", "database", "git",
        "excel", "communication", "leadership", "problem solving", "teamwork", "analytical"
    ] if kw in lower)

    skills_passed = has_skills or skill_keywords_count >= 2
    checklist["skills"] = {
        "passed": skills_passed,
        "keywords_detected": skill_keywords_count,
        "description": "Key technical tools, domain capabilities, and workplace competencies."
    }
    if skills_passed:
        score += 20
        strengths.append(f"Strong skills breakdown with key domain competencies detected ({skill_keywords_count}+ identified).")
    else:
        missing_sections.append("Skills & Competencies")
        recommendations.append("Organize your technical tools and interpersonal strengths into a dedicated Skills section.")

    # 5. Practical Evidence (Projects, Internships, Volunteer, or Work Experience)
    has_projects = any(kw in lower for kw in ["project", "capstone", "portfolio", "github", "practical", "assignment"])
    has_experience = any(kw in lower for kw in ["experience", "employment", "internship", "work history", "volunteer", "leadership"])

    checklist["practical_evidence"] = {
        "passed": has_projects or has_experience,
        "academic_projects_present": has_projects,
        "work_experience_present": has_experience,
        "description": "Practical evidence via academic projects, capstones, volunteer work, or past internships."
    }
    if has_projects or has_experience:
        score += 20
        if has_projects and not has_experience:
            strengths.append("High-value academic and personal projects demonstrating applied technical skills.")
        else:
            strengths.append("Practical experience and project work evidencing hands-on competence.")
    else:
        missing_sections.append("Projects or Practical Experience")
        recommendations.append("Include your top 1-2 university capstone projects or assignments with technologies used.")

    # 6. Readability and Length formatting
    word_count = len(text.split())
    has_good_length = 100 <= word_count <= 2500
    checklist["formatting"] = {
        "passed": has_good_length,
        "word_count": word_count,
        "description": "Optimal document length and readable information density."
    }
    if has_good_length:
        score += 10
        strengths.append(f"Balanced document length ({word_count} words) with appropriate density.")
    else:
        recommendations.append("Review formatting to ensure consistent margins, bullet points, and concise phrasing.")

    # Clamp score to 100
    final_score = min(score, 100)

    # If score is very high and missing sections empty, give encouraging tip
    if not recommendations:
        recommendations.append("Your CV is in excellent shape! Tailor your project highlights to match each specific opportunity.")

    return {
        "score": final_score,
        "checklist_results": checklist,
        "missing_sections": missing_sections,
        "strengths": strengths,
        "recommendations": recommendations
    }
