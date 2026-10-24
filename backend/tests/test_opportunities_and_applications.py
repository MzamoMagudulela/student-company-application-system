import io
import pytest
from datetime import datetime, timezone, timedelta
from fastapi import status

def test_opportunity_discovery_and_filtering(client):
    # Public listings
    resp = client.get("/api/v1/opportunities")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert len(data) >= 1

    # Filter by keyword
    search_resp = client.get("/api/v1/opportunities?q=Python")
    assert search_resp.status_code == status.HTTP_200_OK
    assert any("Python" in item["title"] for item in search_resp.json())

    # Filter by non-existent keyword
    empty_resp = client.get("/api/v1/opportunities?q=NonExistentSkill123")
    assert empty_resp.status_code == status.HTTP_200_OK
    assert len(empty_resp.json()) == 0

def test_application_workflow_and_duplicate_prevention(client):
    # 1. Register candidate
    reg_resp = client.post("/api/v1/auth/register", json={
        "first_name": "Lindiwe",
        "last_name": "Zulu",
        "username": "lindiwe_z",
        "email": "lindiwe@tech.ac.za",
        "password": "Password123!",
        "password_confirm": "Password123!",
        "terms_accepted": True
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update Profile
    prof_resp = client.put("/api/v1/students/profile", json={
        "headline": "Full-Stack Developer Intern",
        "institution": "Tshwane University of Technology",
        "field_of_study": "Diploma in ICT",
        "graduation_year": "2026",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL"],
        "bio": "Enthusiastic developer who enjoys backend architecture and data systems."
    }, headers=headers)
    assert prof_resp.status_code == status.HTTP_200_OK
    assert prof_resp.json()["profile_completion_pct"] > 50

    # 3. Upload a mock PDF CV
    pdf_content = b"%PDF-1.4 mock pdf header content for CV analysis testing"
    files = {"file": ("student_cv.pdf", pdf_content, "application/pdf")}
    cv_resp = client.post("/api/v1/students/cvs/upload", files=files, headers=headers)
    assert cv_resp.status_code == status.HTTP_200_OK
    cv_data = cv_resp.json()
    assert "score" in cv_data
    assert "checklist_results" in cv_data

    # 4. Get active opportunities
    opps_resp = client.get("/api/v1/opportunities")
    active_opp = [o for o in opps_resp.json() if "Junior Python" in o["title"]][0]
    opp_id = active_opp["id"]

    # 5. Submit application
    app_payload = {
        "opportunity_id": opp_id,
        "cover_letter": "I would love to contribute my software skills to this internship.",
        "question_responses": {"availability": "Immediately"},
        "declaration_accepted": True
    }
    app_resp = client.post("/api/v1/students/applications", json=app_payload, headers=headers)
    assert app_resp.status_code == status.HTTP_201_CREATED
    app_data = app_resp.json()
    assert app_data["status"] == "Submitted"
    assert "APP-" in app_data["reference_number"]

    # 6. DUPLICATE PREVENTION: submitting again to the SAME opportunity MUST fail
    dup_app_resp = client.post("/api/v1/students/applications", json=app_payload, headers=headers)
    assert dup_app_resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "already submitted" in dup_app_resp.json()["detail"].lower()

def test_closed_opportunity_submission_rejection(client):
    # Register candidate
    reg_resp = client.post("/api/v1/auth/register", json={
        "first_name": "Kagiso",
        "last_name": "Ndlovu",
        "username": "kagiso_n",
        "email": "kagiso@tech.ac.za",
        "password": "Password123!",
        "password_confirm": "Password123!",
        "terms_accepted": True
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to apply to the expired opportunity seeded in conftest
    opps_resp = client.get("/api/v1/opportunities?include_closed=true")
    closed_opp = [o for o in opps_resp.json() if "Expired" in o["title"]][0]

    app_resp = client.post("/api/v1/students/applications", json={
        "opportunity_id": closed_opp["id"],
        "declaration_accepted": True
    }, headers=headers)

    assert app_resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "closed" in app_resp.json()["detail"].lower()
