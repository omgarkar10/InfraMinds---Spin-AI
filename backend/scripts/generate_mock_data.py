import os
import random
import uuid
import datetime
import json
from google.cloud import bigquery

# Initialize BigQuery client
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
DATASET_ID = os.getenv("BIGQUERY_DATASET", "spin_grievances")
TABLE_ID = f"{PROJECT_ID}.{DATASET_ID}.citizen_complaints"

try:
    client = bigquery.Client(project=PROJECT_ID)
except Exception as e:
    print(f"Warning: Could not initialize BigQuery client: {e}")
    client = None

# Mock Data Configurations
DOMAINS = ["Water", "Road", "Power", "Sanitation", "Transport"]
DISTRICTS = ["District A", "District B", "District C", "District D"]
STATES = ["State X", "State Y"]

# Bounding box for mock coordinates (e.g., India approx coords)
MIN_LAT, MAX_LAT = 8.4, 37.6
MIN_LNG, MAX_LNG = 68.7, 97.2

def generate_mock_grievance():
    return {
        "grievance_id": str(uuid.uuid4()),
        "user_id": f"user_{random.randint(1000, 9999)}",
        "domain": random.choice(DOMAINS),
        "severity": random.randint(1, 10),
        "image_verified": random.choice([True, False]),
        "latitude": round(random.uniform(MIN_LAT, MAX_LAT), 6),
        "longitude": round(random.uniform(MIN_LNG, MAX_LNG), 6),
        "original_text": "Sample grievance text...",
        "english_translation": "Translated sample grievance text...",
        "district": random.choice(DISTRICTS),
        "state": random.choice(STATES),
        "created_at": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=random.randint(0, 45))).isoformat(),
        "gati_shakti_overlap": json.dumps({"intersection": "none"})
    }

def generate_and_insert_mock_data(num_records=100):
    if client is None:
        print("Cannot insert mock data: BigQuery client not initialized.")
        return

    print(f"Generating {num_records} mock records...")
    rows_to_insert = [generate_mock_grievance() for _ in range(num_records)]
    
    # Split into batches of 100 for insertion
    batch_size = 100
    for i in range(0, len(rows_to_insert), batch_size):
        batch = rows_to_insert[i:i + batch_size]
        errors = client.insert_rows_json(TABLE_ID, batch)
        if not errors:
            print(f"Successfully inserted batch {i//batch_size + 1}")
        else:
            print(f"Errors in batch {i//batch_size + 1}: {errors}")

if __name__ == "__main__":
    generate_and_insert_mock_data(100)
    print("Mock data generation complete.")
