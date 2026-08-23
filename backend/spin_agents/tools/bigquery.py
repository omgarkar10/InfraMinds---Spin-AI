import os
import json
import uuid
import datetime
from google.cloud import bigquery
from typing import Dict, Any, List, Optional

# Load environment variables or configuration for project and dataset
# Assuming default project from environment if not specified
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
DATASET_ID = os.getenv("BIGQUERY_DATASET", "spin_grievances")
TABLE_ID = f"{PROJECT_ID}.{DATASET_ID}.citizen_complaints"

# Initialize BigQuery client
try:
    client = bigquery.Client(project=PROJECT_ID)
except Exception as e:
    # Handle the case where credentials aren't set up yet during development
    print(f"Warning: Could not initialize BigQuery client: {e}")
    client = None

def insert_grievance_record(grievance_data: Dict[str, Any]) -> bool:
    """
    Ingest the final JSON output from the Geospatial_Correlation_Agent into BigQuery.
    Maps the Python dictionary payload to the citizen_complaints table schema.
    """
    if client is None:
        print("Mock insert: BigQuery client not initialized.")
        return True

    # Generate UUID and timestamp on the fly
    record_id = str(uuid.uuid4())
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Process gati_shakti_overlap - serialize to JSON string if it's a dict
    gati_shakti_overlap = grievance_data.get("gati_shakti_overlap")
    if isinstance(gati_shakti_overlap, dict) or isinstance(gati_shakti_overlap, list):
        gati_shakti_overlap = json.dumps(gati_shakti_overlap)

    # Construct the row to insert
    row_to_insert = {
        "grievance_id": record_id,
        "user_id": grievance_data.get("user_id", "unknown_user"),
        "domain": grievance_data.get("domain", "Unknown"),
        "severity": int(grievance_data.get("severity", 1)),
        "image_verified": bool(grievance_data.get("image_verified", False)),
        "latitude": float(grievance_data.get("latitude", 0.0)),
        "longitude": float(grievance_data.get("longitude", 0.0)),
        "original_text": grievance_data.get("original_text", ""),
        "english_translation": grievance_data.get("english_translation", ""),
        "district": grievance_data.get("district", "Unknown"),
        "state": grievance_data.get("state", "Unknown"),
        "created_at": created_at,
        "gati_shakti_overlap": gati_shakti_overlap
    }

    errors = client.insert_rows_json(TABLE_ID, [row_to_insert])
    
    if not errors:
        return True
    else:
        print(f"Encountered errors while inserting rows: {errors}")
        return False

def query_weekly_summary(district: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Generate aggregate statistics for the Policy_Dashboard_Agent to write its natural language executive summary.
    """
    if client is None:
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

    query_job = client.query(query, job_config=job_config)
    results = query_job.result()
    
    return [dict(row) for row in results]

def query_red_zones(min_severity: int = 8) -> List[Dict[str, Any]]:
    """
    Supply the frontend HeatMap component with precise coordinate clusters that warrant policymaker attention.
    """
    if client is None:
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

    query_job = client.query(query, job_config=job_config)
    results = query_job.result()
    
    return [dict(row) for row in results]
