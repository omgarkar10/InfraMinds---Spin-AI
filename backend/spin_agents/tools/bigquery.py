"""BigQuery tools for grievance warehousing and aggregation."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from spin_agents.config import CONFIG

try:
    from google.cloud import bigquery
except ImportError:  # pragma: no cover - dev without GCP
    bigquery = None  # type: ignore[assignment]


def _client() -> Any:
    if bigquery is None:
        raise RuntimeError("google-cloud-bigquery is not installed")
    return bigquery.Client(project=CONFIG.gcp_project or None)


def insert_grievance_record(parsed_payload: dict[str, Any]) -> dict[str, Any]:
    """Route parsed grievance JSON into BigQuery."""
    record_id = str(uuid.uuid4())
    row = {
        "grievance_id": record_id,
        "user_id": parsed_payload.get("user_id", ""),
        "domain": parsed_payload.get("domain", "Unknown"),
        "severity": int(parsed_payload.get("severity", 5)),
        "image_verified": bool(parsed_payload.get("image_verified", False)),
        "latitude": float(parsed_payload.get("lat_long", {}).get("lat", 0.0)),
        "longitude": float(parsed_payload.get("lat_long", {}).get("lng", 0.0)),
        "original_text": parsed_payload.get("original_text", ""),
        "english_translation": parsed_payload.get("english_translation", ""),
        "district": parsed_payload.get("district", ""),
        "state": parsed_payload.get("state", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "gati_shakti_overlap": json.dumps(parsed_payload.get("gati_shakti_overlap", {})),
    }

    if bigquery is None or not CONFIG.gcp_project:
        return {"status": "mock_inserted", "grievance_id": record_id, "row": row}

    client = _client()
    table_ref = f"{CONFIG.gcp_project}.{CONFIG.bigquery_dataset}.{CONFIG.bigquery_table}"
    errors = client.insert_rows_json(table_ref, [row])
    if errors:
        return {"status": "error", "errors": errors}
    return {"status": "inserted", "grievance_id": record_id}


def query_weekly_summary(district: str | None = None) -> dict[str, Any]:
    """Aggregate weekly grievance data for executive summaries."""
    if bigquery is None or not CONFIG.gcp_project:
        return {
            "district": district or "Pune",
            "total_complaints": 4200,
            "top_domain": "Water",
            "avg_severity": 7.2,
            "red_zone_count": 14,
            "period": "last_7_days",
        }

    client = _client()
    district_filter = f"AND district = @district" if district else ""
    query = f"""
        SELECT
            district,
            COUNT(*) AS total_complaints,
            APPROX_TOP_COUNT(domain, 1)[OFFSET(0)].value AS top_domain,
            AVG(severity) AS avg_severity,
            COUNTIF(severity >= 8) AS red_zone_count
        FROM `{CONFIG.gcp_project}.{CONFIG.bigquery_dataset}.{CONFIG.bigquery_table}`
        WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
        {district_filter}
        GROUP BY district
        ORDER BY total_complaints DESC
        LIMIT 10
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("district", "STRING", district),
        ]
        if district
        else []
    )
    rows = list(client.query(query, job_config=job_config).result())
    if not rows:
        return {"total_complaints": 0, "period": "last_7_days"}
    row = rows[0]
    return {
        "district": row.district,
        "total_complaints": row.total_complaints,
        "top_domain": row.top_domain,
        "avg_severity": float(row.avg_severity),
        "red_zone_count": row.red_zone_count,
        "period": "last_7_days",
    }


def query_red_zones(min_severity: int = 8) -> list[dict[str, Any]]:
    """Return geospatial clusters for dashboard heat layer."""
    if bigquery is None or not CONFIG.gcp_project:
        return [
            {"lat": 18.5204, "lng": 73.8567, "density": 420, "domain": "Water", "district": "Pune"},
            {"lat": 19.0760, "lng": 72.8777, "density": 380, "domain": "Road", "district": "Mumbai"},
            {"lat": 28.6139, "lng": 77.2090, "density": 510, "domain": "Power", "district": "Delhi"},
        ]

    client = _client()
    query = f"""
        SELECT
            ROUND(latitude, 3) AS lat,
            ROUND(longitude, 3) AS lng,
            COUNT(*) AS density,
            APPROX_TOP_COUNT(domain, 1)[OFFSET(0)].value AS domain,
            APPROX_TOP_COUNT(district, 1)[OFFSET(0)].value AS district
        FROM `{CONFIG.gcp_project}.{CONFIG.bigquery_dataset}.{CONFIG.bigquery_table}`
        WHERE severity >= @min_severity
          AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        GROUP BY lat, lng
        HAVING density >= 5
        ORDER BY density DESC
        LIMIT 200
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("min_severity", "INT64", min_severity)]
    )
    return [
        {
            "lat": row.lat,
            "lng": row.lng,
            "density": row.density,
            "domain": row.domain,
            "district": row.district,
        }
        for row in client.query(query, job_config=job_config).result()
    ]
