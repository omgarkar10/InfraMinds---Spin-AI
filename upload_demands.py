import json
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase (Update the path to your service account key if not already exported in your environment)
cred = credentials.Certificate("backend/service-account.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def upload_demo_data():
    with open('demo_demands.json', 'r', encoding='utf-8') as file:
        demands = json.load(file)

    batch = db.batch()
    
    for demand in demands:
        # Generate a new random document ID for each demand
        doc_ref = db.collection('demands').document()
        batch.set(doc_ref, demand)

    batch.commit()
    print(f"Successfully uploaded {len(demands)} realistic demo demands to Firestore.")

if __name__ == "__main__":
    upload_demo_data()