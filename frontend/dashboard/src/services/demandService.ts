import { auth } from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function fetchDemands() {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(`${API_URL}/demands`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch demands");
  }
  return response.json();
}

export async function voteForDemand(demandId: string) {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(`${API_URL}/demands/${demandId}/vote`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error("Failed to vote for demand");
  }
  return response.json();
}

export function getStoredCitizenUser() {
  const data = localStorage.getItem("citizen_user");
  return data ? JSON.parse(data) : null;
}

export function setStoredCitizenUser(user: any) {
  localStorage.setItem("citizen_user", JSON.stringify(user));
}

export function clearStoredCitizenUser() {
  localStorage.removeItem("citizen_user");
}

export function getStoredStaffUser() {
  const data = localStorage.getItem("staff_user");
  return data ? JSON.parse(data) : null;
}

export function setStoredStaffUser(user: any) {
  localStorage.setItem("staff_user", JSON.stringify(user));
}

export function clearStoredStaffUser() {
  localStorage.removeItem("staff_user");
}

// ============================================================================
// STUBS FOR MIGRATED UI COMPONENTS (Temporary until fully hooked to backend)
// ============================================================================

export interface SubmitRequestPayload {
  description: string;
  category: string;
  location: any;
  priority: string;
  language: string;
  request_type?: string;
}

export function getStoredDemands(...args: any[]): any[] { return []; }
export function getStaffDemands(...args: any[]): any[] { return []; }
export function getStaffDemandById(...args: any[]): any { return undefined; }
export function updateStaffDecision(...args: any[]) {}
export function updateDemandStatus(...args: any[]) {}
export async function getRequestDetailFromBackend(...args: any[]) { return null; }
export function getDemandById(...args: any[]) { return null; }
export async function getMyRequestsFromBackend(...args: any[]) { return []; }
export async function submitRequestToBackend(...args: any[]) {
  return { success: true, Demand_id: "mock-id", created_at: new Date().toISOString(), bigquery_synced: false };
}
export async function uploadEvidenceToBackend(...args: any[]) {
  return { url: "mock-url", filename: "mock-file.jpg" };
}
export async function analyzeRequestWithGemini(...args: any[]) {
  return { status: "success", data: { category: "Other", issue: "Mock", priority: "Low", location: "Mock", confidence: 90, nearbyDemands: 0, redZone: false, reasoning: "Mock" } };
}

export async function castVote(demandId: string): Promise<{ status: string }> {
  const token = localStorage.getItem("citizen_token");
  const response = await fetch(`${API_URL}/demands/${demandId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to cast vote");
  }
  return response.json();
}
