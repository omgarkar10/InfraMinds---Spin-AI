import os
import firebase_admin
from firebase_admin import credentials, auth

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

def create_or_update_user(email: str, password: str, display_name: str, role: str, department: str):
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
    try:
        auth.set_custom_user_claims(user.uid, custom_claims)
        print(f"   |-- Set Claims: {custom_claims}")
    except Exception as e:
        print(f"   |-- [ERROR] Failed to set claims: {e}")


def seed_accounts():
    print("Seeding Administrators...")
    create_or_update_user("admin@gov.in", SHARED_PASSWORD, "System Administrator", "Administrator", "General Administration")
    create_or_update_user("ministry@nic.in", SHARED_PASSWORD, "Dr. R. K. Sharma", "Policymaker", "Ministry of Housing & Urban Affairs (MoHUA)")

    print("\nSeeding Departmental Staff...")
    for email_prefix, department in STAFF_ACCOUNTS:
        create_or_update_user(
            f"{email_prefix}.officer@gov.in", 
            SHARED_PASSWORD, 
            f"{department} Officer", 
            "Department Officer", 
            department
        )
        create_or_update_user(
            f"{email_prefix}.field@gov.in", 
            SHARED_PASSWORD, 
            f"{department} Field Inspector", 
            "Field Inspector", 
            department
        )
        create_or_update_user(
            f"{email_prefix}.policy@gov.in", 
            SHARED_PASSWORD, 
            f"{department} Policymaker", 
            "Policymaker", 
            department
        )

if __name__ == "__main__":
    print("Starting secure staff account seeding using Firebase Admin SDK...")
    seed_accounts()
    print("Done. All accounts now have cryptographically secure custom claims.")
