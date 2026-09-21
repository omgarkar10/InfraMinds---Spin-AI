import { apiClient } from "./apiClient";

export async function getCountriesConfig() {
  return apiClient.get<any>("/config/countries");
}

export async function getAuthConfig() {
  return apiClient.get<any>("/config/auth");
}

export async function citizenSignup(payload: { name: string; countryCode: string; phone: string; password: string; }) {
  const data = await apiClient.post<any>("/auth/citizen/signup", payload);
  if (data.access_token) {
    localStorage.setItem("citizen_token", data.access_token);
  }
  return data;
}

export async function citizenLogin(payload: { countryCode: string; phone: string; password: string; }) {
  const data = await apiClient.post<any>("/auth/citizen/login", payload);
  if (data.access_token) {
    localStorage.setItem("citizen_token", data.access_token);
  }
  return data;
}

export async function citizenForgotPassword(payload: { countryCode: string; phone: string; }) {
  return apiClient.post<any>("/auth/citizen/forgot-password", payload);
}

export async function citizenResetPassword(payload: { phone: string; password: string; }) {
  return apiClient.post<any>("/auth/citizen/reset-password", payload);
}

export function citizenLogout() {
  localStorage.removeItem("citizen_token");
}

export async function staffLogin(identifier: string, password: string) {
  const data = await apiClient.post<any>("/auth/staff-login", { identifier, password });
  if (data.access_token) {
    localStorage.setItem("staff_token", data.access_token);
  }
  return data;
}
