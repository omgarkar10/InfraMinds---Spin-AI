import { auth } from "../config/firebase";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080/api`;

export async function fetchDemands() {
  const response = await fetch(`${API_URL}/demands`);
  if (!response.ok) {
    throw new Error("Failed to fetch demands");
  }
  return response.json();
}

export async function fetchMyVotes() {
  const token = await auth.currentUser?.getIdToken(true) || localStorage.getItem("citizen_token");
  if (!token) return [];
  const response = await fetch(`${API_URL}/users/me/votes`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.voted_demand_ids || [];
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

export function getStoredDemands(..._args: any[]): any[] { return []; }
export function getStaffDemands(..._args: any[]): any[] { return []; }
export function getStaffDemandById(..._args: any[]): any { return undefined; }
export function updateStaffDecision(..._args: any[]) {}
export function updateDemandStatus(..._args: any[]) {}
export async function getRequestDetailFromBackend(demandId: string) {
  const token = await auth.currentUser?.getIdToken(true) || localStorage.getItem("citizen_token");
  const response = await fetch(`${API_URL}/demands/${demandId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error("Request not found in authoritative registry.");
  }
  return response.json();
}
export function getDemandById(..._args: any[]) { return null; }
export async function submitRequestToBackend(payload: SubmitRequestPayload) {
  const token = await auth.currentUser?.getIdToken(true) || localStorage.getItem("citizen_token");
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
  const token = await auth.currentUser?.getIdToken(true) || localStorage.getItem("citizen_token");
  const userStr = localStorage.getItem("citizen_user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user || !user.id) return [];
  
  const response = await fetch(`${API_URL}/demands?author_user_id=${user.id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  
  if (!response.ok) return [];
  
  const data = await response.json();
  return data.demands || [];
}

export async function uploadEvidenceToBackend(file: File) {
  const token = await auth.currentUser?.getIdToken(true) || localStorage.getItem("citizen_token");
  if (!token) throw new Error("Must be logged in to upload");
  
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload file");
  }

  const data = await response.json();
  return { url: data.url, filename: data.filename };
}
// Maps backend GrievanceCategory enum values → frontend CATEGORY_ISSUE_MAP keys
const BACKEND_CATEGORY_TO_FRONTEND: Record<string, string> = {
  "electricity": "Electricity",
  "water": "Water Supply",
  "roads": "Roads & Potholes",
  "garbage": "Waste Management",
  "drainage": "Drainage / Flooding",
  "street_lighting": "Street Lighting",
  "public_health": "Public Health",
  "education": "Education",
  "housing": "Housing",
  "other": "Other",
};

export async function analyzeRequestWithGemini(textToAnalyze: string) {
  try {
    const userStr = localStorage.getItem("citizen_user");
    const user = userStr ? JSON.parse(userStr) : { id: "anonymous" };

    const payload = {
      citizen_id: user.id,
      channel: "pwa",
      text: textToAnalyze,
      language: "en"
    };

    const response = await fetch(`${API_URL.replace('/api', '')}/a2a/semantic-parsing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`AI Parsing failed: ${response.status}`);
    }

    const data = await response.json();

    // Normalize category: map backend enum → frontend display key
    const rawCategory: string = (data.category || "other").toLowerCase();
    const frontendCategory = BACKEND_CATEGORY_TO_FRONTEND[rawCategory] || "Other";

    // Normalize request type: backend returns GrievanceType like "issue", "complaint" → map to frontend
    const rawType: string = (data.type || "").toLowerCase();
    const frontendRequestType =
      rawType === "suggestion" || rawType === "new_development"
        ? "new_development"
        : "existing_problem";

    return {
      status: "success",
      data: {
        request_type: frontendRequestType,
        category: frontendCategory,
        description: data.description_translated || data.description_original || "",
        state: data.location?.state || null,
        district: data.location?.district || null,
        landmark: data.location?.landmark_text || data.location?.location_landmark || null,
        specific_issue: frontendCategory,
      }
    };
  } catch (err: any) {
    console.error("AI Analysis error:", err);
    return { status: "error", message: err.message };
  }
}

export async function castVote(demandId: string): Promise<{ status: string }> {
  const token = await auth.currentUser?.getIdToken(true) || localStorage.getItem("citizen_token");
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
