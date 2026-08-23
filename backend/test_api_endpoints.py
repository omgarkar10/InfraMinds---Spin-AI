"""
Automated REST API Verification Script for SPIN FastAPI Backend (api.py).
Tests all 6 endpoints:
1. GET  /health
2. POST /webhook/citizen
3. POST /api/pipeline/run
4. GET  /api/dashboard/summary
5. GET  /api/dashboard/red-zones
6. POST /api/dashboard/policy-action
"""

from __future__ import annotations

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from spin_agents.api import app

client = TestClient(app)


def test_health_endpoint():
    print("Testing GET /health...")
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data.get("status") == "ok"
    assert data.get("service") == "spin-citizen-edge"
    print("✓ GET /health passed:", data)


def test_citizen_webhook_text_with_location():
    print("\nTesting POST /webhook/citizen (Text + Location)...")
    payload = {
        "user_id": "test_user_101",
        "text": "Pipe leakage near MG Road",
        "source_language": "en",
        "location": {"lat": 18.5204, "lng": 73.8567},
    }
    response = client.post("/webhook/citizen", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "session_id" in data
    assert data.get("next_step") == "run_pipeline"
    print("✓ POST /webhook/citizen passed:", data)


def test_citizen_webhook_missing_location():
    print("\nTesting POST /webhook/citizen (Missing Location -> HITL Gate)...")
    payload = {
        "user_id": "test_user_102",
        "text": "Road cavity forming near market",
        "source_language": "en",
        "location": None,
    }
    response = client.post("/webhook/citizen", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data.get("next_step") == "awaiting_location"
    assert "prompt" in data
    print("✓ POST /webhook/citizen (HITL) passed:", data)


def test_pipeline_run_intake_only():
    print("\nTesting POST /api/pipeline/run (Intake Only mode)...")
    payload = {
        "user_id": "test_user_103",
        "text": "Power outage in sector 4",
        "source_language": "en",
        "location": {"lat": 19.076, "lng": 72.8777},
        "run_adk": False,
    }
    response = client.post("/api/pipeline/run", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data.get("status") == "intake_only"
    print("✓ POST /api/pipeline/run (Intake Only) passed:", data)


def test_dashboard_summary():
    print("\nTesting GET /api/dashboard/summary...")
    response = client.get("/api/dashboard/summary?district=Pune")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "executive_summary" in data
    assert "weekly_stats" in data
    assert data["weekly_stats"].get("district") == "Pune"
    print("✓ GET /api/dashboard/summary passed:", data["executive_summary"])


def test_dashboard_red_zones():
    print("\nTesting GET /api/dashboard/red-zones...")
    response = client.get("/api/dashboard/red-zones?min_severity=8")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "red_zones" in data
    assert "count" in data
    assert isinstance(data["red_zones"], list)
    print(f"✓ GET /api/dashboard/red-zones passed: Received {data['count']} red zones.")


def test_policy_action():
    print("\nTesting POST /api/dashboard/policy-action...")
    payload = {
        "grievance_id": "grievance-test-77",
        "user_id": "citizen_9942",
        "target_language": "hi",
        "action": "reallocated",
        "budget_cr": 12.5,
        "message_en": "Budget reallocation approved for water pipeline repairs.",
    }
    response = client.post("/api/dashboard/policy-action", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data.get("status") == "reallocated"
    assert data.get("budget_reallocated_cr") == 12.5
    print("✓ POST /api/dashboard/policy-action passed:", data)


def test_staff_department_filtering():
    print("\nTesting GET /api/staff/grievances (Department Filtering)...")
    # 1. Water Supply Staff request
    res_water = client.get("/api/staff/grievances", headers={"X-Staff-Department": "Water Supply"})
    assert res_water.status_code == 200
    data_water = res_water.json()
    assert data_water["department"] == "Water Supply"
    for g in data_water["grievances"]:
        assert g["department"] == "Water Supply"
    print("✓ Water Supply department filter passed:", len(data_water["grievances"]), "grievance(s)")

    # 2. Admin request
    res_admin = client.get("/api/staff/grievances", headers={"X-Staff-Role": "admin"})
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    assert len(data_admin["grievances"]) >= len(data_water["grievances"])
    print("✓ Admin cross-department access passed:", len(data_admin["grievances"]), "total grievances")


def test_staff_grievance_authorization_check():
    print("\nTesting GET /api/staff/grievances/{id} (Security Authorization Check)...")
    # Authorized access: Water officer requesting Water grievance
    res_ok = client.get("/api/staff/grievances/SPIN-2026-WTR001", headers={"X-Staff-Department": "Water Supply"})
    assert res_ok.status_code == 200
    print("✓ Authorized department access granted (200 OK)")

    # Unauthorized access: Electricity officer requesting Water grievance
    res_forbidden = client.get("/api/staff/grievances/SPIN-2026-WTR001", headers={"X-Staff-Department": "Electricity"})
    assert res_forbidden.status_code == 403
    print("✓ Unauthorized cross-department access rejected (403 Forbidden):", res_forbidden.json()["detail"])


def run_all_tests():
    print("=" * 70)
    print("       SPIN REST API VERIFICATION SUITE")
    print("=" * 70)
    test_health_endpoint()
    test_citizen_webhook_text_with_location()
    test_citizen_webhook_missing_location()
    test_pipeline_run_intake_only()
    test_dashboard_summary()
    test_dashboard_red_zones()
    test_policy_action()
    test_staff_department_filtering()
    test_staff_grievance_authorization_check()
    print("\n" + "=" * 70)
    print("       ALL REST API ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()

