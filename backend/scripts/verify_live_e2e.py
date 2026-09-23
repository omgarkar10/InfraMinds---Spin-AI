"""
Live End-to-End Verification Script for SPIN Citizen Portal.
Executes against the running server at http://127.0.0.1:8080.
Verifies all flows requested in Section 11 of the user instructions.
"""

import io
import json
import time
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8080/api"

def make_req(path, method="GET", data=None, token=None, files=None):
    if path.startswith("http"):
        url = path
    elif path == "/health":
        url = "http://127.0.0.1:8080/health"
    else:
        url = f"{BASE_URL}{path}"
    headers = {}
    body = None

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if files:
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        buf = io.BytesIO()
        for field_name, (filename, content, mime) in files.items():
            buf.write(f"--{boundary}\r\n".encode())
            buf.write(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode())
            buf.write(f"Content-Type: {mime}\r\n\r\n".encode())
            buf.write(content)
            buf.write(b"\r\n")
        buf.write(f"--{boundary}--\r\n".encode())
        body = buf.getvalue()
    elif data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            resp_body = resp.read().decode("utf-8")
            return status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed


def run_e2e():
    print("=" * 70)
    print("STARTING COMPLETE LIVE CITIZEN PORTAL E2E VERIFICATION")
    print("=" * 70)

    # 1. Health check
    status, data = make_req("/health")
    assert status == 200, f"Health check failed: {status}"
    print(f"[1/11] Health check OK: {data}")

    # 2. Register New Citizen A
    unique_phone_a = f"98{int(time.time() * 1000) % 100000000:08d}"
    signup_data = {
        "name": "Aarav Sharma",
        "countryCode": "IN",
        "phone": unique_phone_a,
        "password": "Password123!"
    }
    status, res_signup = make_req("/auth/citizen/signup", method="POST", data=signup_data)
    assert status == 200, f"Signup failed: {res_signup}"
    token_a = res_signup["access_token"]
    user_a_id = res_signup["user"]["id"]
    print(f"[2/11] Registered citizen 'Aarav Sharma' (Phone: {unique_phone_a}): token acquired.")

    # 3. Duplicate Registration Rejection
    status, res_dup = make_req("/auth/citizen/signup", method="POST", data=signup_data)
    assert status == 400, f"Duplicate signup did not fail with 400: {status}"
    print(f"[3/11] Duplicate account rejected with status 400: {res_dup.get('detail')}")

    # 4. Incorrect Login Rejection
    status, res_bad_login = make_req("/auth/citizen/login", method="POST", data={
        "countryCode": "IN",
        "phone": unique_phone_a,
        "password": "WrongPassword!"
    })
    assert status == 401, f"Bad login did not return 401: {status}"
    print(f"[4/11] Invalid login correctly rejected with 401: {res_bad_login.get('detail')}")

    # 5. Clean Empty State for New Citizen
    status, res_empty = make_req("/requests/my", token=token_a)
    assert status == 200
    assert len(res_empty) == 0, f"Expected 0 requests for new user, got {len(res_empty)}"
    print(f"[5/11] New citizen verified clean empty state: {len(res_empty)} requests.")

    # 6. Submit New Development Request (Type B)
    type_b_payload = {
        "request_type": "new_development",
        "category": "Education",
        "specific_issue": "Community Digital Study Center",
        "description": "Village needs a digital classroom and community library for 300 rural school children.",
        "state": "Karnataka",
        "district": "Mysuru",
        "address": "Near Gram Panchayat Bhavan, Main Village Road",
        "landmark": "Opposite Rural Post Office",
        "pincode": "570001",
        "latitude": 12.2958,
        "longitude": 76.6394,
        "reason": "Nearest educational facility is 15 km away with no direct transit.",
        "intended_beneficiaries": "300 rural students and youth",
    }
    status, res_sub_b = make_req("/requests/submit", method="POST", data=type_b_payload, token=token_a)
    assert status == 200, f"Type B submission failed: {res_sub_b}"
    req_b_id = res_sub_b["grievance_id"]
    assert req_b_id.startswith("SPIN-2026-"), f"Unexpected ID format: {req_b_id}"
    print(f"[6/11] Submitted New Development Request: Genuine ID generated: {req_b_id}")

    # 7. Submit Existing Infrastructure Problem (Type A)
    type_a_payload = {
        "request_type": "existing_problem",
        "category": "Water Supply",
        "specific_issue": "Pipeline leakage / burst",
        "description": "Severe drinking water main burst flooding the roadway near sector clinic.",
        "state": "Maharashtra",
        "district": "Pune",
        "address": "Near Sector 4 Reservoir",
        "pincode": "411038",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "start_date": "2026-09-20",
        "frequency": "Continuous",
    }
    status, res_sub_a = make_req("/requests/submit", method="POST", data=type_a_payload, token=token_a)
    assert status == 200, f"Type A submission failed: {res_sub_a}"
    req_a_id = res_sub_a["grievance_id"]
    assert req_a_id.startswith("SPIN-2026-"), f"Unexpected ID format: {req_a_id}"
    print(f"[7/11] Submitted Existing Infrastructure Problem: Genuine ID generated: {req_a_id}")

    # 8. Retrieve My Requests (Must contain both submissions)
    status, my_requests = make_req("/requests/my", token=token_a)
    assert status == 200
    assert len(my_requests) == 2, f"Expected 2 requests, got {len(my_requests)}"
    ids = [r["grievance_id"] for r in my_requests]
    assert req_b_id in ids and req_a_id in ids
    print(f"[8/11] My Requests retrieved: {len(my_requests)} submissions found with IDs: {ids}")

    # 9. Retrieve Individual Request Detail
    status, detail_b = make_req(f"/requests/{req_b_id}", token=token_a)
    assert status == 200
    assert detail_b["grievance_id"] == req_b_id
    assert detail_b["request_type"] == "new_development"
    assert detail_b["district"] == "Mysuru"
    assert detail_b["state"] == "Karnataka"
    assert detail_b["intended_beneficiaries"] == "300 rural students and youth"
    print(f"[9/11] Request Detail verified: Type='{detail_b['request_type']}', District='{detail_b['district']}', Timeline steps={len(detail_b['timeline'])}")

    # 10. Security: Cross-user Authorization Enforcement
    unique_phone_b = f"97{int(time.time() * 1000) % 100000000:08d}"
    status, res_signup_b = make_req("/auth/citizen/signup", method="POST", data={
        "name": "Citizen Other",
        "countryCode": "IN",
        "phone": unique_phone_b,
        "password": "PasswordBeta123!"
    })
    token_b = res_signup_b["access_token"]

    # Citizen B tries to retrieve Citizen A's requests
    status, res_forbid = make_req(f"/requests/citizen/{user_a_id}", token=token_b)
    assert status == 403, f"Expected 403 Forbidden, got {status}"
    status, res_forbid_detail = make_req(f"/requests/{req_b_id}", token=token_b)
    assert status == 403, f"Expected 403 Forbidden, got {status}"
    print(f"[10/11] Security verified: Citizen B blocked from Citizen A's submissions (403 Forbidden).")

    # 11. Evidence Upload & File Verification
    fake_img = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRtestsample"
    status, res_upload = make_req(
        "/requests/upload",
        method="POST",
        token=token_a,
        files={"file": ("site_photo.png", fake_img, "image/png")}
    )
    assert status == 200, f"Upload failed: {res_upload}"
    file_url = res_upload["url"]
    print(f"[11/11] Supporting Evidence upload OK: URL='{file_url}'")

    print("\n" + "=" * 70)
    print("ALL 11 END-TO-END INTEGRATED VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e()
