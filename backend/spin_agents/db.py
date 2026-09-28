import firebase_admin
from firebase_admin import credentials, firestore
from spin_agents.config import CONFIG
import os

# Initialize Firebase app if not already initialized
if not firebase_admin._apps:
    cred_path = getattr(CONFIG, 'firebase_credentials_path', None) or os.getenv('FIREBASE_CREDENTIALS_PATH')
    gcred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    elif gcred_path and os.path.exists(gcred_path):
        cred = credentials.Certificate(gcred_path)
        firebase_admin.initialize_app(cred)
    else:
        # If GOOGLE_APPLICATION_CREDENTIALS points to a missing file path, remove it from env to prevent google.auth crash
        if gcred_path and not os.path.exists(gcred_path):
            os.environ.pop('GOOGLE_APPLICATION_CREDENTIALS', None)

        project_id = os.getenv('FIREBASE_PROJECT_ID') or os.getenv('GOOGLE_CLOUD_PROJECT') or 'demo-project'
        try:
            firebase_admin.initialize_app(options={'projectId': project_id})
        except Exception:
            firebase_admin.initialize_app(credentials.AnonymousCredentials(), options={'projectId': project_id})

try:
    db = firestore.client()
except Exception as err:
    print(f"Warning: Firestore client initialization failed: {err}")
    db = None

def get_firestore_db():
    return db

