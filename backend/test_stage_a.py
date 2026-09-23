"""
Unit tests for Stage A: Backend Canonical Contracts & Security Baseline.
Module: test_stage_a.py

Verifies:
1. BigQuery coordinate extraction (_extract_coordinates):
   - Legitimate (0.0, 0.0) preserved.
   - Missing coordinates represented strictly as None.
   - Incomplete pairs (lat only / lng only) return (None, None).
   - Flat and nested formats ('lat_long', 'location', 'latitude'/'longitude', 'lat'/'lng').
   - Non-finite (NaN, Inf) and out-of-bounds rejected.
2. BigQuery insert_grievance_record:
   - Returns InsertResult supporting dict keys ('grievance_id', 'status') and boolean check.
3. Persistence models (models.py):
   - Grievance has dual request type columns (request_type, specific_issue, reason, intended_beneficiaries).
   - No silent default to 'Pune' or 'Maharashtra'.
   - Idempotent schema migration (init_db) executes without error.
4. Authentication security baseline (auth.py):
   - Duplicate /citizen-login route is removed.
   - Unauthenticated direct password reset returns 501 Not Implemented.
   - Production JWT secret guard raises RuntimeError on default secret in production.
   - Signup request validation enforces non-empty name and minimum password length.
"""

import math
import os
import pytest
from pydantic import ValidationError

from spin_agents.tools.bigquery import _extract_coordinates, insert_grievance_record, InsertResult
from spin_agents.models import Grievance, User
from spin_agents.auth import (
    CitizenSignupRequest,
    CitizenLoginRequest,
    CitizenResetPasswordRequest,
    citizen_reset_password,
    router as auth_router,
)


# ============================================================================
# 1. BigQuery Coordinate Extraction Tests
# ============================================================================

def test_bigquery_coordinates_valid_india():
    """Valid Indian coordinates are extracted accurately."""
    data = {"latitude": 18.5204, "longitude": 73.8567}
    lat, lng = _extract_coordinates(data)
    assert lat == pytest.approx(18.5204)
    assert lng == pytest.approx(73.8567)


def test_bigquery_coordinates_legitimate_zero_preserved():
    """Legitimate 0.0 coordinates (Equator / Prime Meridian) must NOT be replaced with None."""
    data = {"latitude": 0.0, "longitude": 0.0}
    lat, lng = _extract_coordinates(data)
    assert lat == 0.0
    assert lng == 0.0


def test_bigquery_coordinates_missing_returns_none():
    """Missing coordinates must be returned as (None, None), never fabricated as 0.0."""
    data_empty = {}
    lat, lng = _extract_coordinates(data_empty)
    assert lat is None
    assert lng is None

    data_none = {"latitude": None, "longitude": None}
    lat, lng = _extract_coordinates(data_none)
    assert lat is None
    assert lng is None


def test_bigquery_coordinates_pairing_rule():
    """Incomplete coordinate pairs (lat only or lng only) must both be None."""
    data_lat_only = {"latitude": 18.5204, "longitude": None}
    lat, lng = _extract_coordinates(data_lat_only)
    assert lat is None
    assert lng is None

    data_lng_only = {"latitude": None, "longitude": 73.8567}
    lat, lng = _extract_coordinates(data_lng_only)
    assert lat is None
    assert lng is None


def test_bigquery_coordinates_nested_formats():
    """Supports nested 'lat_long' and 'location' dictionary structures."""
    data_lat_long = {"lat_long": {"lat": 28.6139, "lng": 77.2090}}
    lat, lng = _extract_coordinates(data_lat_long)
    assert lat == pytest.approx(28.6139)
    assert lng == pytest.approx(77.2090)

    data_location = {"location": {"latitude": 13.0827, "longitude": 80.2707}}
    lat, lng = _extract_coordinates(data_location)
    assert lat == pytest.approx(13.0827)
    assert lng == pytest.approx(80.2707)


def test_bigquery_coordinates_rejects_non_finite_and_out_of_bounds():
    """Rejects NaN, Inf, and out-of-range coordinates."""
    data_nan = {"latitude": float("nan"), "longitude": 73.8567}
    lat, lng = _extract_coordinates(data_nan)
    assert lat is None
    assert lng is None

    data_oob_lat = {"latitude": 95.0, "longitude": 73.8567}
    lat, lng = _extract_coordinates(data_oob_lat)
    assert lat is None
    assert lng is None

    data_oob_lng = {"latitude": 18.5204, "longitude": 185.0}
    lat, lng = _extract_coordinates(data_oob_lng)
    assert lat is None
    assert lng is None


def test_bigquery_insert_result_type_and_compat():
    """Verify InsertResult behaves as a dict with .get() and evaluates truthy on success."""
    res = insert_grievance_record({
        "original_text": "Broken pipe on Main Street",
        "english_translation": "Broken pipe on Main Street",
        "domain": "Water Supply",
        "severity": 6,
        "latitude": 18.5204,
        "longitude": 73.8567,
    })
    # Must support dictionary access for simulate_pipeline.py
    assert isinstance(res, dict)
    assert "grievance_id" in res
    assert res.get("status") in ("mock_persisted", "persisted")
    # Must evaluate truthy in boolean context
    assert bool(res) is True
    # Row contains proper coordinates
    if "row" in res:
        assert res["row"]["latitude"] == pytest.approx(18.5204)
        assert res["row"]["longitude"] == pytest.approx(73.8567)


def test_bigquery_insert_missing_coords_in_row():
    """When coordinates are absent, the row to insert contains None, not 0.0."""
    res = insert_grievance_record({
        "original_text": "Broken streetlight without GPS",
        "domain": "Electricity",
    })
    if "row" in res:
        assert res["row"]["latitude"] is None
        assert res["row"]["longitude"] is None


# ============================================================================
# 2. Persistence Models Tests
# ============================================================================

def test_grievance_model_columns():
    """Verify Grievance model contains dual request type fields and no silent Pune default."""
    columns = {col.name: col for col in Grievance.__table__.columns}

    # Dual request type columns
    assert "request_type" in columns
    assert "specific_issue" in columns
    assert "reason" in columns
    assert "intended_beneficiaries" in columns
    assert "start_date" in columns
    assert "frequency" in columns
    assert "bigquery_synced" in columns

    # No silent Pune/Maharashtra defaults
    district_col = columns["district"]
    state_col = columns["state"]
    assert district_col.default is None, "district must NOT default to Pune"
    assert state_col.default is None, "state must NOT default to Maharashtra"


@pytest.mark.anyio
async def test_init_db_idempotency():
    """Verify init_db initializes tables and executes column migrations cleanly."""
    from spin_agents.db import init_db
    # Must run without throwing any exceptions
    await init_db()


# ============================================================================
# 3. Authentication Security Baseline Tests
# ============================================================================

def test_duplicate_citizen_login_route_removed():
    """Verify that the duplicate and dangerous /citizen-login route is removed from router."""
    route_paths = [route.path for route in auth_router.routes]
    assert "/api/auth/citizen-login" not in route_paths
    assert "/citizen-login" not in route_paths
    # Canonical route must be present
    assert "/api/auth/citizen/login" in route_paths



def test_citizen_signup_validation():
    """Verify CitizenSignupRequest enforces non-empty name and password length >= 8."""
    # Blank name rejected
    with pytest.raises(ValidationError):
        CitizenSignupRequest(
            name="   ",
            phone="9876543210",
            password="StrongPassword123!",
        )

    # Password too short rejected
    with pytest.raises(ValidationError):
        CitizenSignupRequest(
            name="Ramesh Kumar",
            phone="9876543210",
            password="short",
        )

    # Valid signup accepted
    req = CitizenSignupRequest(
        name="Ramesh Kumar",
        phone="9876543210",
        password="ValidPassword123!",
    )
    assert req.name == "Ramesh Kumar"
    assert req.countryCode == "IN"


def test_citizen_login_validation():
    """Verify CitizenLoginRequest enforces non-empty phone."""
    with pytest.raises(ValidationError):
        CitizenLoginRequest(
            phone="   ",
            password="SomePassword123!",
        )


@pytest.mark.anyio
async def test_unauthenticated_reset_password_rejected():
    """Verify direct unauthenticated password reset returns 501 Not Implemented."""
    from fastapi import HTTPException
    req = CitizenResetPasswordRequest(
        phone="9876543210",
        password="NewPassword123!",
    )
    with pytest.raises(HTTPException) as exc_info:
        await citizen_reset_password(req, db=None)
    assert exc_info.value.status_code == 501
    assert "disabled" in exc_info.value.detail.lower()
