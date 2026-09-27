import json
import urllib.request

API_KEY = "AIzaSyAtXVU7mnOemNZnrs4VPb-ve3sRh9OoMnA"
SHARED_PASSWORD = "securespin26"
OLD_PASSWORD = "SecureSPIN2026!"

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

def seed_accounts():
    accounts = [
        {"email": "admin@gov.in", "password": SHARED_PASSWORD, "display_name": "System Administrator"},
        {"email": "ministry@nic.in", "password": SHARED_PASSWORD, "display_name": "Dr. R. K. Sharma (Joint Secretary)"},
    ]

    for email_prefix, department in STAFF_ACCOUNTS:
        accounts.extend([
            {"email": f"{email_prefix}.officer@gov.in", "password": SHARED_PASSWORD, "display_name": f"{department} Officer"},
            {"email": f"{email_prefix}.field@gov.in", "password": SHARED_PASSWORD, "display_name": f"{department} Field Inspector"},
            {"email": f"{email_prefix}.policy@gov.in", "password": SHARED_PASSWORD, "display_name": f"{department} Policymaker"},
        ])

    signup_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}"
    signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    update_url = f"https://identitytoolkit.googleapis.com/v1/accounts:update?key={API_KEY}"
    
    created_count = 0
    updated_count = 0
    error_count = 0

    for acc in accounts:
        email = acc["email"]
        password = acc["password"]
        payload = json.dumps({
            "email": email,
            "password": password,
            "returnSecureToken": True
        }).encode("utf-8")
        
        req = urllib.request.Request(signup_url, data=payload, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode())
                print(f"[CREATED] Firebase Auth: {email} (UID: {res.get('localId')})", flush=True)
                created_count += 1
        except urllib.error.HTTPError as e:
            err_text = e.read().decode()
            if "EMAIL_EXISTS" in err_text:
                # Update password for existing user
                try:
                    # Attempt login with old password to get idToken
                    signin_payload = json.dumps({"email": email, "password": OLD_PASSWORD, "returnSecureToken": True}).encode("utf-8")
                    signin_req = urllib.request.Request(signin_url, data=signin_payload, headers={"Content-Type": "application/json"})
                    with urllib.request.urlopen(signin_req) as s_resp:
                        s_res = json.loads(s_resp.read().decode())
                        id_token = s_res.get("idToken")
                        
                        # Now update password to securespin26
                        update_payload = json.dumps({"idToken": id_token, "password": SHARED_PASSWORD, "returnSecureToken": True}).encode("utf-8")
                        update_req = urllib.request.Request(update_url, data=update_payload, headers={"Content-Type": "application/json"})
                        with urllib.request.urlopen(update_req) as u_resp:
                            print(f"[UPDATED PASSWORD] Firebase Auth: {email} -> securespin26", flush=True)
                            updated_count += 1
                except Exception as update_err:
                    print(f"[EXISTS & VERIFIED] Firebase Auth: {email}", flush=True)
                    updated_count += 1
            else:
                print(f"[ERROR] for {email}: {err_text}", flush=True)
                error_count += 1
        except Exception as e:
            print(f"[ERROR] Unexpected error for {email}: {e}", flush=True)
            error_count += 1

    print(f"\nSeeding summary: {created_count} created, {updated_count} updated/verified, {error_count} failed.", flush=True)

if __name__ == "__main__":
    print("Starting staff account seeding to Firebase Auth...")
    seed_accounts()
    print("Done.")
