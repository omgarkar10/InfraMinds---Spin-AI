import os
import firebase_admin
from firebase_admin import credentials, auth, firestore

# Initialize Firebase Admin SDK
if os.path.exists("secrets/service-account.json"):
    cred = credentials.Certificate("secrets/service-account.json")
    default_app = firebase_admin.initialize_app(cred)
elif os.path.exists("backend/service-account.json"):
    cred = credentials.Certificate("backend/service-account.json")
    default_app = firebase_admin.initialize_app(cred)
elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
    default_app = firebase_admin.initialize_app()
else:
    raise RuntimeError("No service-account.json found in secrets/ or backend/, nor GOOGLE_APPLICATION_CREDENTIALS set.")

db = firestore.client()

SHARED_PASSWORD = "securespin26"

STAFF_ACCOUNTS = [
    ("water.supply", "Water Supply"),
    ("electricity", "Electricity"),
    ("roads.transport", "Roads & Transport"),
    ("sanitation", "Sanitation"),
    ("public.health", "Public Health"),
    ("police.law", "Police / Law & Order"),
    ("public.transport", "Public Transport"),
    ("education", "Education"),
    ("housing.urban", "Housing & Urban Development"),
    ("environment.forestry", "Environment & Forestry"),
    ("social.welfare", "Social Welfare & Pensions"),
    ("general.administration", "General Administration"),
]

def create_or_update_user(email: str, password: str, display_name: str, role: str, department: str, district_id: str = None):
    try:
        user = auth.get_user_by_email(email)
        # Update existing user
        auth.update_user(
            user.uid,
            password=password,
            display_name=display_name
        )
        print(f"[UPDATED] {email} (UID: {user.uid})")
    except firebase_admin.auth.UserNotFoundError:
        # Create new user
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )
        print(f"[CREATED] {email} (UID: {user.uid})")
    except Exception as e:
        print(f"[ERROR] Could not process {email}: {e}")
        return

    # Set Custom Claims for Role-Based Access Control (RBAC)
    # This is the SECURE way to assign roles instead of trusting frontend email parsing
    custom_claims = {
        "role": role,
        "department": department
    }
    if district_id:
        custom_claims["district_id"] = district_id
    try:
        auth.set_custom_user_claims(user.uid, custom_claims)
        print(f"   |-- Set Claims: {custom_claims}")
    except Exception as e:
        print(f"   |-- [ERROR] Failed to set claims: {e}")

    try:
        db.collection("users").document(user.uid).set({
            "uid": user.uid,
            "email": email,
            "name": display_name,
            "role": role,
            "department_id": department,
            "district_id": district_id,
            "is_verified_resident": True,
            "status": "active"
        }, merge=True)
        print(f"   |-- Written to Firestore users/{user.uid}")
    except Exception as e:
        print(f"   |-- [ERROR] Failed to write to Firestore: {e}")


def get_dept_id(dept_name: str) -> str:
    mapping = {
        "Water Supply": "water",
        "Electricity": "electricity",
        "Roads & Transport": "roads",
        "Sanitation": "garbage",
        "Public Health": "health",
        "Police / Law & Order": "police",
        "Public Transport": "transport",
        "Education": "education",
        "Housing & Urban Development": "housing",
        "Environment & Forestry": "environment",
        "Social Welfare & Pensions": "welfare",
        "General Administration": "other",
        "Ministry of Housing & Urban Affairs (MoHUA)": "all"
    }
    return mapping.get(dept_name, "other")

def seed_accounts():
    print("Seeding Administrators...")
    create_or_update_user("platform.admin@gov.in", SHARED_PASSWORD, "Platform Administrator", "platform_admin", "all")
    create_or_update_user("admin.maharashtra@gov.in", SHARED_PASSWORD, "Maharashtra State Admin", "state_admin", "all")
    create_or_update_user("admin.pune@gov.in", SHARED_PASSWORD, "Pune District Admin", "district_admin", "all", "Pune")
    create_or_update_user("admin@gov.in", SHARED_PASSWORD, "Legacy Admin", "platform_admin", "all")
    create_or_update_user("ministry@nic.in", SHARED_PASSWORD, "Dr. R. K. Sharma", "policymaker", "all")

    print("\nSeeding Departmental Staff...")
    for email_prefix, department in STAFF_ACCOUNTS:
        dept_id = get_dept_id(department)
        
        create_or_update_user(
            f"{email_prefix}.officer@gov.in", 
            SHARED_PASSWORD, 
            f"{department} Officer", 
            "department_officer", 
            dept_id,
            "Pune"
        )
        create_or_update_user(
            f"{email_prefix}.field@gov.in", 
            SHARED_PASSWORD, 
            f"{department} Field Inspector", 
            "field_officer", 
            dept_id,
            "Pune"
        )
        create_or_update_user(
            f"{email_prefix}.policy@gov.in", 
            SHARED_PASSWORD, 
            f"{department} Policymaker", 
            "policymaker", 
            dept_id,
            "Pune"
        )

if __name__ == "__main__":
    print("Starting secure staff account seeding using Firebase Admin SDK...")
    seed_accounts()
    print("Done. All accounts now have cryptographically secure custom claims.")
