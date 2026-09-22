# 03 — Location Contract & Schema Mismatch Investigation

**Document:** `docs/day1/03-location-contract.md`  
**Classification:** VERIFIED (Confirmed directly in active codebase)  
**Status:** Mismatch Confirmed & Canonical Adapter Designed

---

## 1. Executive Summary & Verification Result

The previously reported historical mismatch regarding geospatial coordinates between the semantic parsing / runner components and the BigQuery persistence layer was **thoroughly investigated and CONFIRMED directly in active repository code**.

### The Root Cause Verified:
1. **Producer (`semantic_parsing_agent` in `agent.py:188` & `runner.py:113`)**:
   Outputs a nested dictionary:
   ```json
   "lat_long": {
     "lat": 18.5204,
     "lng": 73.8567
   }
   ```
2. **Consumer (`insert_grievance_record` in `tools/bigquery.py:47-48`)**:
   Expects flat top-level floats:
   ```python
   "latitude": float(grievance_data.get("latitude", 0.0)),
   "longitude": float(grievance_data.get("longitude", 0.0)),
   ```
3. **The Silent Failure**:
   Because `grievance_data` does not contain top-level `"latitude"` or `"longitude"` keys, `grievance_data.get("latitude", 0.0)` silently evaluates to the default fallback `0.0`.
   As a direct consequence, **every grievance inserted into BigQuery is recorded at coordinates (0.0, 0.0)** (Null Island in the Atlantic Ocean off the coast of West Africa), destroying geospatial aggregation and heatmap clustering!

4. **Local SQLite Persistence Divergence (`runner.py:148-149`)**:
   In `runner.py`, the SQLite `Grievance` ORM model receives extracted variables `lat` and `lng`:
   ```python
   latitude=lat,
   longitude=lng,
   ```
   So SQLite correctly stores the coordinates, while BigQuery warehouse receives `(0.0, 0.0)`.

---

## 2. Comprehensive Producer-Consumer Location Mapping Table

| Component / Layer | Source File & Line | Field Name / Format | Null / Missing Behavior | Mismatch Problem |
|:---|:---|:---|:---|:---|
| **Frontend Form** | `RaiseGrievanceForm.tsx:174` | `lat`, `lng`, `address`, `district`, `state`, `pinCode` | Defaults to browser Geolocation or user landmark | Uses camelCase `pinCode` and `isVerified`. |
| **Frontend Chat** | `CitizenChat.tsx:175` | `location: { lat, lng } \| { landmark }` | If missing GPS, passes landmark string | Variable shape: either object or landmark string. |
| **Frontend Types** | `types/index.ts:83-91` | `LocationData { lat, lng, address, district, state, pinCode, isVerified }` | All required in interface, but optional at runtime | Incompatible with BigQuery column names. |
| **Backend API Intake** | `api.py:53, 69` | `location: dict \| None = None` | If `None`, triggers `hitl_required=True` | Unvalidated generic dictionary. |
| **HITL Location Gate** | `agent.py:121` | `intake["location_data"]` | Checks `if not intake.get("location_data")` | Does not validate coordinate ranges or validity. |
| **ADK Semantic Parser** | `agent.py:188` | `"lat_long": {"lat": float, "lng": float}` | Defaults to `{lat: 0.0, lng: 0.0}` in instruction prompt | Violates no-zero rule; formats as nested dict. |
| **Runner Fallback** | `runner.py:84-86` | `loc = intake.get("location_data") or {"lat": 18.5204, "lng": 73.8567}` | **Hardcoded Pune coordinates!** | Silently forces missing locations to Pune. |
| **Gati Shakti Tool** | `tools/gati_shakti.py:22` | `latitude: float, longitude: float` | Function arguments | Requires individual float parameters. |
| **BigQuery Ingest** | `tools/bigquery.py:47-48` | `row_to_insert["latitude"]`, `row_to_insert["longitude"]` | `.get("latitude", 0.0)` | **FAILS:** Missing key defaults to `0.0`. |
| **BigQuery Queries** | `tools/bigquery.py:122-123` | `ROUND(latitude, 3) AS lat, ROUND(longitude, 3) AS lng` | Excludes nulls | Aliases DB columns back to `lat` and `lng`. |
| **SQLite ORM** | `models.py:29-30` | `Column(Float) latitude`, `Column(Float) longitude` | Nullable (`nullable=True`) | Flat column names in DB table. |

---

## 3. Canonical Location Specification

To permanently resolve mismatches across all layers, the canonical `Location` model in `spin_agents.schemas` enforces:

```python
class Location(BaseModel):
    latitude: float | None = Field(
        default=None,
        description="WGS84 Latitude between -90.0 and 90.0. None if unknown."
    )
    longitude: float | None = Field(
        default=None,
        description="WGS84 Longitude between -180.0 and 180.0. None if unknown."
    )
    address: str | None = Field(default=None)
    landmark: str | None = Field(default=None)
    district: str | None = Field(default=None)
    state: str | None = Field(default=None)
    pincode: str | None = Field(default=None)
    is_verified: bool = Field(default=False)
```

### Critical Rules Enforced:
1. **Latitude Range:** Must satisfy `-90.0 <= latitude <= 90.0`. Validated via Pydantic validator.
2. **Longitude Range:** Must satisfy `-180.0 <= longitude <= 180.0`. Validated via Pydantic validator.
3. **No Automatic (0.0, 0.0) Substitution:**
   - Coordinates for missing or landmark-only locations MUST remain `None`.
   - `0.0, 0.0` is a valid geographical coordinate (Gulf of Guinea) and must never represent unknown civic data.
4. **Adapter Support:**
   - `Location.from_lat_long_dict(payload)` normalizes both `{"lat", "lng"}` and `{"latitude", "longitude"}` transparently.

---

## 4. Required Producer-Consumer Normalization Plan

```
                   ┌────────────────────────────────────────┐
                   │        Raw Citizen Ingestion           │
                   │  (lat/lng, landmark, or GPS Pin)       │
                   └──────────────────┬─────────────────────┘
                                      │
                                      ▼
                   ┌────────────────────────────────────────┐
                   │       Location.from_lat_long_dict()    │
                   │  - Validates coordinate boundaries     │
                   │  - Leaves missing coordinates as None  │
                   └──────────────────┬─────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │    BigQuery Ingestion     │             │     SQLite DB Ingestion   │
   │  row["latitude"] = lat    │             │  Grievance.latitude = lat │
   │  row["longitude"] = lng   │             │  Grievance.longitude = lng│
   │  (NULL if None, NEVER 0.0)│             │  (NULL if None, NEVER 0.0)│
   └───────────────────────────┘             └───────────────────────────┘
```

### Files Requiring Updates During Day 2:
1. `backend/spin_agents/tools/bigquery.py:47-48`:
   Update `insert_grievance_record` to check both canonical keys:
   ```python
   lat = grievance_data.get("latitude") or (grievance_data.get("lat_long") or {}).get("lat")
   lng = grievance_data.get("longitude") or (grievance_data.get("lat_long") or {}).get("lng")
   ```
2. `backend/spin_agents/agent.py:188`:
   Update `semantic_parsing_agent` output instruction to produce `"location": {"latitude": ..., "longitude": ...}`.
3. `backend/spin_agents/runner.py:84-86`:
   Remove hardcoded Pune fallback coordinates `{"lat": 18.5204, "lng": 73.8567}`.
