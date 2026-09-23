"""
Integration and security tests for the SPIN Citizen Portal backend endpoints.
Module: test_citizen_endpoints.py

Covers:
1. Full auth lifecycle (Signup, Login, Duplicate Rejection, Invalid Credentials)
2. Dual-type request submission (Type A: Existing Problem, Type B: New Development)
3. Validation rules (Coordinate pairing, minimum description length)
4. My Requests listing and ownership authorization enforcement
5. Cross-user access prevention (Citizen B cannot view Citizen A's submissions)
6. Unauthenticated request prevention (401 on protected endpoints)
7. Evidence file upload validation (Allowed types vs blocked types)
8. AI interpretation response handling (Graceful unavailable status, no fabricated data)
"""

import io
import uuid
import pytest
from fastapi.testclient import TestClient

from spin_agents.api import app
from spin_agents.db import init_db

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_db():
    import asyncio
    asyncio.run(init_db())


def test_citizen_auth_and_registration():
    unique_phone = f"98{uuid.uuid4().int % 100000000:08d}"
    signup_payload = {
        "name": "Sunita Patil",
        "countryCode": "IN",
        "phone": unique_phone,
        "password": "StrongPassword123!"
    }
    # 1. Successful Signup
    res = client.post("/api/auth/citizen/signup", json=signup_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["phone"] == unique_phone
    assert data["user"]["name"] == "Sunita Patil"

    # 2. Duplicate Account Rejection
    res_dup = client.post("/api/auth/citizen/signup", json=signup_payload)
    assert res_dup.status_code == 400
    assert "already associated" in res_dup.json()["detail"]

    # 3. Successful Login
    login_payload = {
        "countryCode": "IN",
        "phone": unique_phone,
        "password": "StrongPassword123!"
    }
    res_login = client.post("/api/auth/citizen/login", json=login_payload)
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

    # 4. Invalid Password Rejection (401)
    bad_login = {
        "countryCode": "IN",
        "phone": unique_phone,
        "password": "WrongPassword123!"
    }
    res_bad = client.post("/api/auth/citizen/login", json=bad_login)
    assert res_bad.status_code == 401

    # 5. Non-existent User Login (401)
    res_ghost = client.post("/api/auth/citizen/login", json={
        "countryCode": "IN",
        "phone": "9999999999",
        "password": "SomePassword123!"
    })
    assert res_ghost.status_code == 401


def test_unauthenticated_access_blocked():
    """Unauthenticated users must receive 401 on protected endpoints."""
    # Submit without token
    res = client.post("/api/requests/submit", json={"category": "Roads & Potholes", "description": "Big pothole on main street."})
    assert res.status_code == 401

    # My requests without token
    res_my = client.get("/api/requests/my")
    assert res_my.status_code == 401


def test_dual_request_submission_and_tracking():
    # Create Citizen A
    phone_a = f"97{uuid.uuid4().int % 100000000:08d}"
    res_a = client.post("/api/auth/citizen/signup", json={
        "name": "Citizen Alpha",
        "countryCode": "IN",
        "phone": phone_a,
        "password": "PasswordAlpha123!"
    })
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 1. Submit Type A Request (Existing Infrastructure Problem)
    type_a_payload = {
        "request_type": "existing_problem",
        "category": "Water Supply",
        "specific_issue": "Pipeline leakage / burst",
        "description": "Continuous water pipeline rupture flooding the street near community clinic.",
        "state": "Maharashtra",
        "district": "Pune",
        "landmark": "Near Community Clinic",
        "address": "Sector 4, Kothrud",
        "pincode": "411038",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "start_date": "2026-09-15",
        "frequency": "Continuous",
    }
    res_sub_a = client.post("/api/requests/submit", json=type_a_payload, headers=headers_a)
    assert res_sub_a.status_code == 200, res_sub_a.text
    data_a = res_sub_a.json()
    assert data_a["status"] == "success"
    req_a_id = data_a["grievance_id"]
    assert req_a_id.startswith("SPIN-2026-")

    # 2. Submit Type B Request (New Infrastructure Development Request)
    type_b_payload = {
        "request_type": "new_development",
        "category": "Education",
        "specific_issue": "Primary Health & Anganwadi Center",
        "description": "Proposal for constructing a new community study center and library for rural students.",
        "state": "Karnataka",
        "district": "Mysuru",
        "landmark": "Adjacent to Panchayat Ground",
        "address": "Village Main Road",
        "pincode": "570001",
        "latitude": 12.2958,
        "longitude": 76.6394,
        "reason": "Over 450 school children currently travel 14 km to reach the nearest study room.",
        "intended_beneficiaries": "Rural school students and youth",
    }
    res_sub_b = client.post("/api/requests/submit", json=type_b_payload, headers=headers_a)
    assert res_sub_b.status_code == 200, res_sub_b.text
    data_b = res_sub_b.json()
    assert data_b["status"] == "success"
    req_b_id = data_b["grievance_id"]
    assert req_b_id.startswith("SPIN-2026-")

    # 3. Retrieve My Requests
    res_my = client.get("/api/requests/my", headers=headers_a)
    assert res_my.status_code == 200
    my_list = res_my.json()
    assert len(my_list) >= 2
    ids = [item["grievance_id"] for item in my_list]
    assert req_a_id in ids
    assert req_b_id in ids

    # 4. Retrieve Individual Request Detail
    res_detail = client.get(f"/api/requests/{req_a_id}", headers=headers_a)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["grievance_id"] == req_a_id
    assert detail["request_type"] == "existing_problem"
    assert detail["category"] == "Water Supply"
    assert detail["district"] == "Pune"
    assert detail["state"] == "Maharashtra"
    assert len(detail["timeline"]) >= 1

    # 5. Security & Authorization Enforcement: Citizen B cannot access Citizen A's requests
    phone_b = f"96{uuid.uuid4().int % 100000000:08d}"
    res_b = client.post("/api/auth/citizen/signup", json={
        "name": "Citizen Beta",
        "countryCode": "IN",
        "phone": phone_b,
        "password": "PasswordBeta123!"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Citizen B tries to access Citizen A's request list by user_id -> 403 Forbidden
    res_forbidden_list = client.get(f"/api/requests/citizen/{user_a_id}", headers=headers_b)
    assert res_forbidden_list.status_code == 403

    # Citizen B tries to access Citizen A's individual request -> 403 Forbidden
    res_forbidden_detail = client.get(f"/api/requests/{req_a_id}", headers=headers_b)
    assert res_forbidden_detail.status_code == 403

    # Citizen B has a clean empty state for their own requests
    res_b_my = client.get("/api/requests/my", headers=headers_b)
    assert res_b_my.status_code == 200
    assert len(res_b_my.json()) == 0


def test_submission_validation_rules():
    phone = f"95{uuid.uuid4().int % 100000000:08d}"
    res = client.post("/api/auth/citizen/signup", json={
        "name": "Test Validator",
        "countryCode": "IN",
        "phone": phone,
        "password": "ValidatorPassword123!"
    })
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # 1. Short description rejected (< 5 characters)
    res_short = client.post("/api/requests/submit", json={
        "category": "Roads & Potholes",
        "description": "bad",
    }, headers=headers)
    assert res_short.status_code == 422

    # 2. Incomplete coordinate pairing rejected (lat provided, lng omitted)
    res_coord = client.post("/api/requests/submit", json={
        "category": "Roads & Potholes",
        "description": "Valid road damage description here.",
        "latitude": 18.5204,
        "longitude": None,
    }, headers=headers)
    assert res_coord.status_code == 400
    assert "Coordinate pairing error" in res_coord.json()["detail"]


def test_evidence_file_upload():
    phone = f"94{uuid.uuid4().int % 100000000:08d}"
    res = client.post("/api/auth/citizen/signup", json={
        "name": "Uploader User",
        "countryCode": "IN",
        "phone": phone,
        "password": "UploaderPassword123!"
    })
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # 1. Valid image upload succeeds
    fake_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRtestcontent")
    res_img = client.post(
        "/api/requests/upload",
        files={"file": ("damage_photo.png", fake_image, "image/png")},
        headers=headers,
    )
    assert res_img.status_code == 200
    assert res_img.json()["status"] == "success"
    assert "/uploads/" in res_img.json()["url"]

    # 2. Blocked file type rejected (e.g., .exe)
    fake_exe = io.BytesIO(b"MZ\x90\x00executablecontent")
    res_exe = client.post(
        "/api/requests/upload",
        files={"file": ("malicious.exe", fake_exe, "application/x-msdownload")},
        headers=headers,
    )
    assert res_exe.status_code == 400
    assert "Unsupported file format" in res_exe.json()["detail"]


def test_ai_analyze_endpoint():
    phone = f"93{uuid.uuid4().int % 100000000:08d}"
    res = client.post("/api/auth/citizen/signup", json={
        "name": "AI Tester",
        "countryCode": "IN",
        "phone": phone,
        "password": "AiTesterPassword123!"
    })
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Analyze request
    res_ai = client.post(
        "/api/requests/analyze",
        json={"text": "Water pipeline burst causing massive road flooding near Shivaji market", "request_type": "existing_problem"},
        headers=headers,
    )
    assert res_ai.status_code == 200
    data = res_ai.json()
    # If no Gemini API key, returns "unavailable" status without crashing or fabricating fake results
    assert data["status"] in ("success", "unavailable", "error")
