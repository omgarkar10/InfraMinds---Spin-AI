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

ROLE_MAP = {
    "policymaker": "pm",
    "department_officer": "do",
    "field_officer": "fo",
    "district_admin": "da",
    "state_admin": "sa",
    "platform_admin": "pa"
}

DEPT_MAP = {
    "water": "wat",
    "electricity": "ele",
    "roads": "rds",
    "garbage": "gbg",
    "drainage": "drn",
    "other": "oth",
    "all": "all"
}

DEPARTMENTS = ["water", "electricity", "roads", "garbage", "drainage", "other"]
DISTRICTS = ["pune", "thane", "mumbai"]
STATE = "maharashtra"

generated_credentials = []

def create_or_update_user(email: str, password: str, display_name: str, role: str, department: str, district_id: str = "all", state_id: str = "all"):
    try:
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=password, display_name=display_name)
        print(f"[UPDATED] {email} (UID: {user.uid})")
    except firebase_admin.auth.UserNotFoundError:
        user = auth.create_user(email=email, password=password, display_name=display_name)
        print(f"[CREATED] {email} (UID: {user.uid})")
    except Exception as e:
        print(f"[ERROR] Could not process {email}: {e}")
        return

    custom_claims = {
        "role": role,
        "department": department,
        "district_id": district_id,
        "state_id": state_id
    }
    
    try:
        auth.set_custom_user_claims(user.uid, custom_claims)
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
            "state_id": state_id,
            "is_verified_resident": True,
            "status": "active"
        }, merge=True)
    except Exception as e:
        print(f"   |-- [ERROR] Failed to write to Firestore: {e}")
        
    generated_credentials.append({
        "role": role,
        "email": email,
        "jurisdiction": f"{district_id.title()} District" if district_id != "all" else "All Districts",
        "password": SHARED_PASSWORD
    })

def generate_email(role, dept_id, district_id, count=1):
    role_code = ROLE_MAP.get(role, "oth")
    dept_code = DEPT_MAP.get(dept_id, "oth")
    district_str = district_id.lower().replace(" ", "")
    district_code = district_str[:3] if len(district_str) >= 3 else district_str.ljust(3, "x")
    unique_id = f"{count:02d}"
    return f"{role_code}.{dept_code}.{district_code}.{unique_id}@spin.gov.in"

def seed_accounts():
    print("Seeding Administrators...")
    create_or_update_user("platform.admin@gov.in", SHARED_PASSWORD, "Platform Administrator", "platform_admin", "all", "all", "all")
    create_or_update_user("admin.maharashtra@gov.in", SHARED_PASSWORD, "Maharashtra State Admin", "state_admin", "all", "all", STATE)
    create_or_update_user("admin@gov.in", SHARED_PASSWORD, "Legacy Admin", "platform_admin", "all", "all", "all")
    create_or_update_user("ministry@nic.in", SHARED_PASSWORD, "Central Policymaker", "policymaker", "all", "all", "all")

    print("\nSeeding Districts & Departments...")
    for dist in DISTRICTS:
        dist_email = generate_email("district_admin", "all", dist)
        create_or_update_user(dist_email, SHARED_PASSWORD, f"{dist.title()} District Admin", "district_admin", "all", dist, STATE)
        
        for dept in DEPARTMENTS:
            pm_email = generate_email("policymaker", dept, dist)
            do_email = generate_email("department_officer", dept, dist)
            fo_email = generate_email("field_officer", dept, dist)
            
            create_or_update_user(pm_email, SHARED_PASSWORD, f"{dept.title()} Policymaker", "policymaker", dept, dist, STATE)
            create_or_update_user(do_email, SHARED_PASSWORD, f"{dept.title()} Officer", "department_officer", dept, dist, STATE)
            create_or_update_user(fo_email, SHARED_PASSWORD, f"{dept.title()} Inspector", "field_officer", dept, dist, STATE)
            
def write_credentials_md():
    with open("credentials.md", "w", encoding="utf-8") as f:
        f.write("# Government Staff & Official Accounts Credentials\n\n")
        f.write(f"> **Default System Password for All Accounts:** `{SHARED_PASSWORD}`\n\n")
        f.write("---\n\n## 👑 1. Multi-Tenant Administration Accounts\n\n")
        f.write("| Role / Tier | Email Address | Jurisdiction | Default Password |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        
        for acc in generated_credentials:
            if acc['role'] in ["platform_admin", "state_admin", "district_admin"]:
                f.write(f"| **{acc['role'].replace('_', ' ').title()}** | `{acc['email']}` | {acc['jurisdiction']} | `{acc['password']}` |\n")
                
        f.write("\n---\n\n## 🏛️ 2. Departmental Staff Accounts\n\n")
        f.write("| Role | Email Address | Jurisdiction | Default Password |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        
        for acc in generated_credentials:
            if acc['role'] not in ["platform_admin", "state_admin", "district_admin"]:
                f.write(f"| **{acc['role'].replace('_', ' ').title()}** | `{acc['email']}` | {acc['jurisdiction']} | `{acc['password']}` |\n")
                
        f.write("\n---\n\n## 📊 Summary of Account Roles\n\n")
        f.write("* **Total Seeded Accounts:** 40+\n")
        f.write(f"* **Shared Password:** `{SHARED_PASSWORD}`\n")
        f.write("* **Authentication Provider:** Firebase Auth & SPIN Backend Database Sync\n")
        f.write("* **Hierarchical RBAC Levels:** `platform_admin` > `state_admin` > `district_admin` > `policymaker` > `department_officer` > `field_officer`\n")

if __name__ == "__main__":
    print("Starting secure staff account seeding using Firebase Admin SDK...")
    seed_accounts()
    write_credentials_md()
    print("Done. All accounts generated and written to credentials.md")
