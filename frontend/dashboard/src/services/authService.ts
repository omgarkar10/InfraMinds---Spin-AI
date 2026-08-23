const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function sendOtp(phone: string) {
  const response = await fetch(`${API_URL}/auth/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to send OTP");
  }
  return response.json();
}

export async function verifyOtp(phone: string, code: string) {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, code }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid OTP");
  }
  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("citizen_token", data.access_token);
  }
  return data;
}

export async function staffLogin(identifier: string, password: string) {
  const response = await fetch(`${API_URL}/auth/staff-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier, password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid credentials");
  }
  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("staff_token", data.access_token);
  }
  return data;
}
