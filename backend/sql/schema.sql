CREATE SCHEMA IF NOT EXISTS spin_grievances;

CREATE TABLE IF NOT EXISTS spin_grievances.citizen_complaints (
  grievance_id STRING NOT NULL,
  user_id STRING NOT NULL,
  domain STRING,
  severity INT64,
  image_verified BOOL,
  latitude FLOAT64,
  longitude FLOAT64,
  original_text STRING,
  english_translation STRING,
  district STRING,
  state STRING,
  created_at TIMESTAMP,
  gati_shakti_overlap STRING
)
PARTITION BY DATE(created_at)
CLUSTER BY district, domain;

CREATE OR REPLACE VIEW spin_grievances.red_zone_clusters AS
SELECT
  ROUND(latitude, 3) AS lat,
  ROUND(longitude, 3) AS lng,
  COUNT(*) AS density,
  APPROX_TOP_COUNT(domain, 1)[OFFSET(0)].value AS domain,
  APPROX_TOP_COUNT(district, 1)[OFFSET(0)].value AS district
FROM spin_grievances.citizen_complaints
WHERE severity >= 8
  AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY lat, lng
HAVING density >= 5;
