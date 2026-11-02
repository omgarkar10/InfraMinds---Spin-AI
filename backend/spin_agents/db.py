import firebase_admin
from firebase_admin import credentials, firestore
from spin_agents.config import CONFIG
import os

# Initialize Firebase app if not already initialized
if not firebase_admin._apps:
    cred_path = getattr(CONFIG, 'firebase_credentials_path', None) or os.getenv('FIREBASE_CREDENTIALS_PATH')
    gcred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

    # Resolve candidate credential file paths across backend dir, root, and secrets
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    workspace_root = os.path.dirname(backend_dir)
    candidate_paths = [
        cred_path,
        gcred_path,
        os.path.join(backend_dir, gcred_path.lstrip('./').lstrip('.\\')) if gcred_path else None,
        os.path.join(backend_dir, "service-account.json"),
        os.path.join(backend_dir, "secrets", "service-account.json"),
        os.path.join(workspace_root, "secrets", "service-account.json"),
        os.path.join(workspace_root, "backend", "service-account.json"),
    ]

    resolved_cred = None
    for p in candidate_paths:
        if p and os.path.exists(p):
            resolved_cred = p
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.abspath(p)
            break

    if resolved_cred:
        cred = credentials.Certificate(resolved_cred)
        firebase_admin.initialize_app(cred)
    else:
        # If GOOGLE_APPLICATION_CREDENTIALS points to a missing file path, remove it to prevent crash
        if gcred_path and not os.path.exists(gcred_path):
            os.environ.pop('GOOGLE_APPLICATION_CREDENTIALS', None)

        project_id = os.getenv('FIREBASE_PROJECT_ID') or os.getenv('GOOGLE_CLOUD_PROJECT') or 'demo-project'
        storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET') or f"{project_id}.appspot.com"
        options = {'projectId': project_id, 'storageBucket': storage_bucket}
        try:
            firebase_admin.initialize_app(options=options)
        except Exception:
            firebase_admin.initialize_app(credentials.AnonymousCredentials(), options=options)

try:
    db = firestore.client()
except Exception as err:
    print(f"Warning: Firestore client initialization failed: {err}")
    db = None

def get_firestore_db():
    return db
