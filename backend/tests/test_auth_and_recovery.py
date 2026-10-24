import pytest
from datetime import datetime, timezone, timedelta
from fastapi import status

def test_student_registration_and_login(client):
    reg_payload = {
        "first_name": "Sipho",
        "last_name": "Dlamini",
        "username": "sipho_student",
        "email": "sipho@varsity.ac.za",
        "phone_number": "+27 83 555 1234",
        "password": "Password123!",
        "password_confirm": "Password123!",
        "terms_accepted": True
    }
    # 1. Register student
    resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["username"] == "sipho_student"
    assert data["user"]["role"] == "student"
    assert data["user"]["account_status"] == "active"
    token = data["access_token"]

    # 2. Check me endpoint
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == status.HTTP_200_OK
    assert me_resp.json()["email"] == "sipho@varsity.ac.za"

    # 3. Duplicate registration rejection
    dup_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == status.HTTP_400_BAD_REQUEST

    # 4. Successful login
    login_resp = client.post("/api/v1/auth/login", json={
        "identifier": "sipho_student",
        "password": "Password123!"
    })
    assert login_resp.status_code == status.HTTP_200_OK
    assert "access_token" in login_resp.json()

    # 5. Logout
    logout_resp = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == status.HTTP_200_OK

    # 6. Session should now be invalid
    expired_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert expired_resp.status_code == status.HTTP_401_UNAUTHORIZED

def test_login_failed_attempts_and_lockout(client):
    # Register candidate for lockout test
    client.post("/api/v1/auth/register", json={
        "first_name": "Lock",
        "last_name": "Test",
        "username": "lock_candidate",
        "email": "lock@test.co.za",
        "password": "SecretPass123!",
        "password_confirm": "SecretPass123!",
        "terms_accepted": True
    })

    # Attempt 4 wrong passwords
    for i in range(4):
        res = client.post("/api/v1/auth/login", json={
            "identifier": "lock_candidate",
            "password": "WrongPassword!"
        })
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    # 5th failed attempt triggers lockout
    lock_res = client.post("/api/v1/auth/login", json={
        "identifier": "lock_candidate",
        "password": "WrongPassword!"
    })
    assert lock_res.status_code == status.HTTP_403_FORBIDDEN
    assert "locked" in lock_res.json()["detail"].lower()

def test_account_recovery_and_token_reuse_prevention(client):
    # Register user for recovery
    client.post("/api/v1/auth/register", json={
        "first_name": "Thabo",
        "last_name": "Mokoena",
        "username": "thabo_m",
        "email": "thabo@future.org.za",
        "password": "OldPassword123!",
        "password_confirm": "OldPassword123!",
        "terms_accepted": True
    })

    # 1. Non-enumerating recovery initiation
    rec_resp = client.post("/api/v1/auth/recovery/initiate", json={
        "method": "email",
        "identifier": "thabo@future.org.za"
    })
    assert rec_resp.status_code == status.HTTP_200_OK
    data = rec_resp.json()
    assert "eligible account" in data["message"]
    recovery_token = data["recovery_token"]
    assert recovery_token is not None

    # 2. Token verification
    verify_resp = client.get(f"/api/v1/auth/recovery/verify?token={recovery_token}")
    assert verify_resp.status_code == status.HTTP_200_OK
    assert verify_resp.json()["valid"] is True

    # 3. Complete password reset with single-use token
    reset_resp = client.post("/api/v1/auth/recovery/complete", json={
        "recovery_token": recovery_token,
        "new_password": "NewSecurePassword2026!",
        "confirm_password": "NewSecurePassword2026!"
    })
    assert reset_resp.status_code == status.HTTP_200_OK
    assert reset_resp.json()["success"] is True

    # 4. Token REUSE PREVENTION: attempting to use the token again MUST be rejected
    reuse_resp = client.post("/api/v1/auth/recovery/complete", json={
        "recovery_token": recovery_token,
        "new_password": "AnotherPassword123!",
        "confirm_password": "AnotherPassword123!"
    })
    assert reuse_resp.status_code == status.HTTP_400_BAD_REQUEST

    # 5. Login with new password succeeds
    login_new = client.post("/api/v1/auth/login", json={
        "identifier": "thabo_m",
        "password": "NewSecurePassword2026!"
    })
    assert login_new.status_code == status.HTTP_200_OK

    # 6. Login with old password fails
    login_old = client.post("/api/v1/auth/login", json={
        "identifier": "thabo_m",
        "password": "OldPassword123!"
    })
    assert login_old.status_code == status.HTTP_401_UNAUTHORIZED
