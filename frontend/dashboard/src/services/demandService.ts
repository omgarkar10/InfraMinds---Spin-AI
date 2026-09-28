import { auth } from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080/api`;

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
  location?: any;
  priority?: string;
  language?: string;
  request_type?: string;
  specific_issue?: string;
  state?: string;
  district?: string;
  landmark?: string;
  address?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  start_date?: string;
  frequency?: string;
  reason?: string;
  intended_beneficiaries?: string;
  evidence_urls?: string[];
  source_language?: string;
  bhashini_translated_text?: string;
}

export function getStoredDemands(...args: any[]): any[] { return []; }
export function getStaffDemands(...args: any[]): any[] { return []; }
export function getStaffDemandById(...args: any[]): any { return undefined; }
export function updateStaffDecision(...args: any[]) {}
export function updateDemandStatus(...args: any[]) {}
export async function getRequestDetailFromBackend(...args: any[]) { return null; }
export function getDemandById(...args: any[]) { return null; }
export async function submitRequestToBackend(payload: SubmitRequestPayload) {
  const token = localStorage.getItem("citizen_token");
  const userStr = localStorage.getItem("citizen_user");
  const user = userStr ? JSON.parse(userStr) : { id: "anonymous" };

  const textPayload = `
Category: ${payload.category}
Issue: ${payload.specific_issue}
Description: ${payload.description}
Address: ${payload.address}, ${payload.district}, ${payload.state}, ${payload.pincode}
Reason: ${payload.reason || 'N/A'}
Beneficiaries: ${payload.intended_beneficiaries || 'N/A'}
  `.trim();

  const pipelinePayload = {
    user_id: user.id,
    text: textPayload,
    source_language: payload.source_language || "en",
    location: payload.latitude ? { lat: payload.latitude, lng: payload.longitude } : null,
    media_url: payload.evidence_urls && payload.evidence_urls.length > 0 ? payload.evidence_urls[0] : null,
    run_adk: true,
    channel: "pwa"
  };

  const response = await fetch(`${API_URL}/pipeline/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(pipelinePayload)
  });

  if (!response.ok) {
    throw new Error("Failed to submit request to pipeline");
  }

  const result = await response.json();
  return {
    success: true,
    Demand_id: result.demand_id || "generated-id",
    created_at: new Date().toISOString(),
    bigquery_synced: result.pipeline_status === "completed"
  };
}

export async function getMyRequestsFromBackend() {
  const token = localStorage.getItem("citizen_token");
  const userStr = localStorage.getItem("citizen_user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user || !user.id) return [];
  
  // For now, fetch all demands and filter by user_id
  const response = await fetch(`${API_URL}/demands`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  
  if (!response.ok) return [];
  
  const data = await response.json();
  if (data && data.demands) {
    return data.demands.filter((d: any) => d.author_user_id === user.id);
  }
  return [];
}

export async function uploadEvidenceToBackend(file: File) {
  // Mocking upload to Firebase Storage or backend, since an actual file upload endpoint doesn't exist yet
  // In a real implementation, we would upload to Firebase Storage and return the download URL
  return { url: URL.createObjectURL(file), filename: file.name };
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
