const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function getCountriesConfig() {
  const response = await fetch(`${API_URL}/config/countries`);
  if (!response.ok) {
    throw new Error("Failed to load country configuration");
  }
  return response.json();
}

export async function getAuthConfig() {
  const response = await fetch(`${API_URL}/config/auth`);
  if (!response.ok) {
    throw new Error("Failed to load authentication configuration");
  }
  return response.json();
}

export async function citizenSignup(payload: { name: string; countryCode: string; phone: string; password: string; }) {
  const response = await fetch(`${API_URL}/auth/citizen/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Unable to create your account.");
  }
  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("citizen_token", data.access_token);
  }
  return data;
}

export async function citizenLogin(payload: { countryCode: string; phone: string; password: string; }) {
  const response = await fetch(`${API_URL}/auth/citizen/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid phone number or password.");
  }
  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("citizen_token", data.access_token);
  }
  return data;
}

export async function citizenForgotPassword(payload: { countryCode: string; phone: string; }) {
  const response = await fetch(`${API_URL}/auth/citizen/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to process request.");
  }
  return response.json();
}

export async function citizenResetPassword(payload: { phone: string; password: string; }) {
  const response = await fetch(`${API_URL}/auth/citizen/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to reset password.");
  }
  return response.json();
}

export function citizenLogout() {
  localStorage.removeItem("citizen_token");
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
