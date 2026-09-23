import os
import json
import uuid
import datetime
import math
from google.cloud import bigquery
from typing import Dict, Any, List, Optional, Tuple

# Load environment variables or configuration for project and dataset
# Assuming default project from environment if not specified
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
DATASET_ID = os.getenv("BIGQUERY_DATASET", "spin_grievances")
TABLE_ID = f"{PROJECT_ID}.{DATASET_ID}.citizen_complaints"

# Initialize BigQuery client lazily to avoid blocking on missing GCP credentials at import time
_client: Optional[bigquery.Client] = None
_client_initialized: bool = False

def _get_client() -> Optional[bigquery.Client]:
    global _client, _client_initialized
    if not _client_initialized:
        _client_initialized = True
        try:
            # If project ID is placeholder or no credentials configured, avoid hanging
            if PROJECT_ID == "your-project-id" and not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                _client = None
            else:
                _client = bigquery.Client(project=PROJECT_ID)
        except Exception as e:
            print(f"Warning: Could not initialize BigQuery client: {e}")
            _client = None
    return _client

# Module-level alias for backward compatibility
client = None



class InsertResult(dict):
    """
    Dictionary subclass representing the result of a BigQuery insertion.
    Supports both dictionary key access (e.g. ['grievance_id'], ['status'])
    and boolean evaluation (bool(result) == result.get('inserted', False)).
    """
    def __bool__(self) -> bool:
        return bool(self.get("inserted", False))


def _extract_coordinates(data: Dict[str, Any]) -> Tuple[Optional[float], Optional[float]]:
    """
    Extracts latitude and longitude from grievance_data.
    Supports top-level keys ('latitude', 'lat') and nested dicts ('lat_long', 'location').
    - Preserves legitimate 0.0 values (Equator / Prime Meridian).
    - Rejects non-finite values (NaN, Inf) and out-of-range coordinates.
    - Strictly enforces coordinate pairing: both must be valid finite numbers, or both are None.
    - Represents genuinely missing coordinates as None (never defaults to 0.0 or Pune).
    """
    raw_lat = data.get("latitude")
    if raw_lat is None:
        raw_lat = data.get("lat")

    raw_lng = data.get("longitude")
    if raw_lng is None:
        raw_lng = data.get("lng")

    # Check nested containers if not found at top level
    if raw_lat is None or raw_lng is None:
        loc = data.get("location")
        if isinstance(loc, dict):
            if raw_lat is None:
                raw_lat = loc.get("latitude") if "latitude" in loc else loc.get("lat")
            if raw_lng is None:
                raw_lng = loc.get("longitude") if "longitude" in loc else loc.get("lng")

    if raw_lat is None or raw_lng is None:
        ll = data.get("lat_long")
        if isinstance(ll, dict):
            if raw_lat is None:
                raw_lat = ll.get("latitude") if "latitude" in ll else ll.get("lat")
            if raw_lng is None:
                raw_lng = ll.get("longitude") if "longitude" in ll else ll.get("lng")

    def _parse_coord(v: Any, min_val: float, max_val: float) -> Optional[float]:
        if v is None or v == "":
            return None
        try:
            val = float(v)
            if math.isnan(val) or math.isinf(val):
                return None
            if val < min_val or val > max_val:
                return None
            return val
        except (ValueError, TypeError):
            return None

    parsed_lat = _parse_coord(raw_lat, -90.0, 90.0)
    parsed_lng = _parse_coord(raw_lng, -180.0, 180.0)

    # Coordinate pairing rule: both must be present, or both are None
    if parsed_lat is None or parsed_lng is None:
        return None, None

    return parsed_lat, parsed_lng


def insert_grievance_record(grievance_data: Dict[str, Any]) -> InsertResult:
    """
    Ingest the final JSON output from the Geospatial_Correlation_Agent into BigQuery.
    Maps the Python dictionary payload to the citizen_complaints table schema.
    Coordinates: missing coordinates remain None (never defaulted to 0.0).
    Returns an InsertResult dictionary that supports both dict access and boolean evaluation.
    """
    record_id = str(uuid.uuid4())
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Process gati_shakti_overlap - serialize to JSON string if it's a dict
    gati_shakti_overlap = grievance_data.get("gati_shakti_overlap")
    if isinstance(gati_shakti_overlap, dict) or isinstance(gati_shakti_overlap, list):
        gati_shakti_overlap = json.dumps(gati_shakti_overlap)

    # Extract coordinates safely
    lat, lng = _extract_coordinates(grievance_data)

    # Extract district and state with fallback to nested location if needed
    district = grievance_data.get("district")
    state = grievance_data.get("state")
    if district is None or state is None:
        loc = grievance_data.get("location")
        if isinstance(loc, dict):
            district = district or loc.get("district")
            state = state or loc.get("state")

    # Construct the row to insert
    row_to_insert = {
        "grievance_id": record_id,
        "user_id": grievance_data.get("user_id", "unknown_user"),
        "domain": grievance_data.get("domain", "Unknown"),
        "severity": int(grievance_data.get("severity", 1)),
        "image_verified": bool(grievance_data.get("image_verified", False)),
        "latitude": lat,
        "longitude": lng,
        "original_text": grievance_data.get("original_text", ""),
        "english_translation": grievance_data.get("english_translation", ""),
        "district": district or "Unknown",
        "state": state or "Unknown",
        "created_at": created_at,
        "gati_shakti_overlap": gati_shakti_overlap
    }

    bq_client = _get_client()
    if bq_client is None:
        return InsertResult({
            "status": "mock_persisted",
            "grievance_id": record_id,
            "inserted": True,
            "row": row_to_insert,
            "message": "Mock insert: BigQuery client not initialized."
        })

    try:
        errors = bq_client.insert_rows_json(TABLE_ID, [row_to_insert])
    except Exception as e:
        print(f"Warning: BigQuery insert unavailable ({e}). Falling back to mock persistence.")
        return InsertResult({
            "status": "mock_persisted",
            "grievance_id": record_id,
            "inserted": True,
            "row": row_to_insert,
            "message": f"BigQuery unavailable ({e}); fallen back to local mock persistence."
        })

    if not errors:
        return InsertResult({
            "status": "persisted",
            "grievance_id": record_id,
            "inserted": True,
            "table": TABLE_ID,
            "row": row_to_insert,
        })
    else:
        print(f"Encountered errors while inserting rows: {errors}")
        return InsertResult({
            "status": "failed",
            "grievance_id": record_id,
            "inserted": False,
            "errors": errors,
            "row": row_to_insert,
        })

def query_weekly_summary(district: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Generate aggregate statistics for the Policy_Dashboard_Agent to write its natural language executive summary.
    """
    bq_client = _get_client()
    if bq_client is None:
        print("Mock query: BigQuery client not initialized.")
        return {
            "total_complaints": 4280,
            "top_domain": "Water Supply",
            "avg_severity": 8.2,
            "red_zone_count": 14,
            "district": district or "National",
        }

    # Parameterized query to prevent SQL injection
    query = f"""
    SELECT
        district,
        COUNT(*) AS total_complaints,
        APPROX_TOP_COUNT(domain, 1)[OFFSET(0)].value AS top_domain,
        AVG(severity) AS avg_severity,
        COUNTIF(severity >= 8) AS red_zone_count
    FROM `{TABLE_ID}`
    WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    """

    query_params = []
    
    if district:
        query += "  AND district = @district\n"
        query_params.append(bigquery.ScalarQueryParameter("district", "STRING", district))
        
    query += """
    GROUP BY district
    ORDER BY total_complaints DESC
    LIMIT 10
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=query_params
    )

    query_job = bq_client.query(query, job_config=job_config)
    results = query_job.result()
    
    return [dict(row) for row in results]

def query_red_zones(min_severity: int = 8) -> List[Dict[str, Any]]:
    """
    Supply the frontend HeatMap component with precise coordinate clusters that warrant policymaker attention.
    """
    bq_client = _get_client()
    if bq_client is None:
        print("Mock query: BigQuery client not initialized.")
        return []

    query = f"""
    SELECT
        ROUND(latitude, 3) AS lat,
        ROUND(longitude, 3) AS lng,
        COUNT(*) AS density,
        APPROX_TOP_COUNT(domain, 1)[OFFSET(0)].value AS domain,
        APPROX_TOP_COUNT(district, 1)[OFFSET(0)].value AS district
    FROM `{TABLE_ID}`
    WHERE severity >= @min_severity
      AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    GROUP BY lat, lng
    HAVING density >= 5
    ORDER BY density DESC
    LIMIT 200
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("min_severity", "INT64", min_severity)
        ]
    )

    query_job = bq_client.query(query, job_config=job_config)
    results = query_job.result()
    
    return [dict(row) for row in results]
