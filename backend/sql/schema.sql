-- 1. Database Schema (spin_grievances)
-- Primary Table: citizen_complaints

CREATE TABLE IF NOT EXISTS `spin_grievances.citizen_complaints` (
    grievance_id STRING NOT NULL,
    user_id STRING NOT NULL,
    domain STRING NOT NULL,
    severity INT64 NOT NULL,
    image_verified BOOL NOT NULL,
    latitude FLOAT64 NOT NULL,
    longitude FLOAT64 NOT NULL,
    original_text STRING NOT NULL,
    english_translation STRING NOT NULL,
    district STRING NOT NULL,
    state STRING NOT NULL,
    created_at TIMESTAMP NOT NULL,
    gati_shakti_overlap JSON
)
PARTITION BY DATE(created_at)
CLUSTER BY district, domain;

-- 2. Aggregated View: red_zone_clusters
-- A materialized view that calculates complaint density for the heat map.

CREATE OR REPLACE VIEW `spin_grievances.red_zone_clusters` AS
SELECT
    ROUND(latitude, 3) AS lat,
    ROUND(longitude, 3) AS lng,
    COUNT(*) AS density,
    APPROX_TOP_COUNT(domain, 1)[OFFSET(0)].value AS dominant_domain,
    APPROX_TOP_COUNT(district, 1)[OFFSET(0)].value AS dominant_district
FROM `spin_grievances.citizen_complaints`
WHERE severity >= 8
  AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY lat, lng
HAVING COUNT(*) >= 5;
