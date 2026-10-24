import pytest
from datetime import datetime, timezone, timedelta
from fastapi import status

def test_admin_application_review_and_offer_issuance(client):
    # 1. Login as Admin
    admin_login = client.post("/api/v1/auth/login", json={
        "identifier": "test_admin",
        "password": "AdminPass2026!"
    })
    assert admin_login.status_code == status.HTTP_200_OK
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Check Admin Dashboard Stats
    stats_resp = client.get("/api/v1/admin/dashboard-stats", headers=admin_headers)
    assert stats_resp.status_code == status.HTTP_200_OK
    assert "total_students" in stats_resp.json()

    # 3. Create a student who applies
    stu_reg = client.post("/api/v1/auth/register", json={
        "first_name": "Ayanda",
        "last_name": "Nkosi",
        "username": "ayanda_n",
        "email": "ayanda@mzansi.ac.za",
        "password": "Password123!",
        "password_confirm": "Password123!",
        "terms_accepted": True
    })
    stu_token = stu_reg.json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    opps = client.get("/api/v1/opportunities").json()
    open_opp = [o for o in opps if "Junior Python" in o["title"]][0]

    app_res = client.post("/api/v1/students/applications", json={
        "opportunity_id": open_opp["id"],
        "declaration_accepted": True
    }, headers=stu_headers)
    app_id = app_res.json()["id"]

    # 4. Status Transition: Submitted -> Under Review (Allowed)
    st_res = client.put(f"/api/v1/admin/applications/{app_id}/status", json={
        "new_status": "Under Review",
        "notes": "Application moved to candidate screening."
    }, headers=admin_headers)
    assert st_res.status_code == status.HTTP_200_OK
    assert st_res.json()["status"] == "Under Review"

    # 5. Invalid Status Transition: Under Review -> Accepted (Disallowed!)
    bad_st_res = client.put(f"/api/v1/admin/applications/{app_id}/status", json={
        "new_status": "Accepted",
        "notes": "Attempting illegal direct jump."
    }, headers=admin_headers)
    assert bad_st_res.status_code == status.HTTP_400_BAD_REQUEST
    assert "not permitted" in bad_st_res.json()["detail"].lower()

    # 6. Valid Transition: Under Review -> Shortlisted -> Interview
    client.put(f"/api/v1/admin/applications/{app_id}/status", json={
        "new_status": "Shortlisted",
        "notes": "Candidate shortlisted."
    }, headers=admin_headers)

    client.put(f"/api/v1/admin/applications/{app_id}/status", json={
        "new_status": "Interview",
        "notes": "Technical interview scheduled."
    }, headers=admin_headers)

    # 7. Issue Formal Offer Letter
    deadline = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    start_date = (datetime.now(timezone.utc) + timedelta(days=21)).isoformat()

    offer_resp = client.post(f"/api/v1/admin/applications/{app_id}/issue-offer", json={
        "response_deadline": deadline,
        "start_date": start_date,
        "terms_and_conditions": "Standard 12-month appointment contract terms.",
        "salary_stipend": "R14,000 pm"
    }, headers=admin_headers)
    assert offer_resp.status_code == status.HTTP_200_OK
    offer_data = offer_resp.json()
    assert "OFFER-" in offer_data["offer_reference"]
    assert offer_data["status"] == "issued"
    offer_id = offer_data["id"]

    # 8. Download Generated Offer PDF
    pdf_resp = client.get(f"/api/v1/students/offers/{offer_id}/download-pdf", headers=stu_headers)
    assert pdf_resp.status_code == status.HTTP_200_OK
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 500  # Non-empty PDF binary

    # 9. Student Formally Accepts Offer
    accept_resp = client.post(f"/api/v1/students/offers/{offer_id}/respond", json={
        "action": "accept",
        "notes": "Thank you, I enthusiastically accept this appointment!"
    }, headers=stu_headers)
    assert accept_resp.status_code == status.HTTP_200_OK
    assert accept_resp.json()["status"] == "accepted"

    # 10. Check Audit Logs were recorded
    audit_resp = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_resp.status_code == status.HTTP_200_OK
    actions = [a["action"] for a in audit_resp.json()]
    assert "ISSUE_OFFER_LETTER" in actions
    assert "OFFER_ACCEPT" in actions
