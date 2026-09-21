import { apiClient } from "./apiClient";
import type { Grievance, GrievanceStatus, StaffUser, CitizenUser } from "../types";

const STORAGE_DRAFT_KEY = "spin_grievance_draft";

/* Helper functions for LocalStorage management (drafts only) */
export function saveGrievanceDraft(data: any): void {
  localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(data));
}

export function getGrievanceDraft(): any | null {
  const data = localStorage.getItem(STORAGE_DRAFT_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearGrievanceDraft(): void {
  localStorage.removeItem(STORAGE_DRAFT_KEY);
}

/**
 * Checks if a staff user has super-admin or policymaker privilege to view all departments.
 */
export function isSuperAdmin(user: StaffUser): boolean {
  if (!user || !user.isLoggedIn) return false;
  const roleLower = (user.role || "").toLowerCase();
  return (
    roleLower === "administrator" ||
    roleLower === "admin" ||
    roleLower === "policymaker" ||
    roleLower === "super-admin"
  );
}

/* API Calls */

export async function submitGrievancePipeline(payload: {
  user_id: string;
  text: string;
  source_language: string;
  location: any;
  media_url?: string;
  run_adk?: boolean;
}) {
  return apiClient.post<any>("/api/pipeline/run", payload);
}

export async function fetchGrievances(): Promise<Grievance[]> {
  const res = await apiClient.get<any>("/api/grievances?limit=100");
  return (res.grievances || []).map(mapBackendGrievanceToFrontend);
}

export async function fetchGrievanceById(id: string): Promise<Grievance | undefined> {
  // Ideally this would be a single item fetch. For now we use the list and find it.
  const grievances = await fetchGrievances();
  return grievances.find(g => g.id.toLowerCase() === id.toLowerCase());
}

export async function fetchStaffGrievances(staffUser: StaffUser): Promise<Grievance[]> {
  const allGrievances = await fetchGrievances();
  if (isSuperAdmin(staffUser)) {
    return allGrievances;
  }
  
  // Need to normalize department string for matching, 
  // For simplicity we just match loosely
  const userDeptLower = (staffUser.department || "").toLowerCase();
  return allGrievances.filter(g => 
    (g.department || "").toLowerCase().includes(userDeptLower) ||
    userDeptLower.includes((g.department || "").toLowerCase())
  );
}

export async function fetchStaffGrievanceById(id: string, staffUser: StaffUser): Promise<Grievance | undefined> {
  const grievance = await fetchGrievanceById(id);
  if (!grievance) return undefined;
  if (isSuperAdmin(staffUser)) return grievance;

  const userDeptLower = (staffUser.department || "").toLowerCase();
  const grievanceDeptLower = (grievance.department || "").toLowerCase();

  if (!userDeptLower.includes(grievanceDeptLower) && !grievanceDeptLower.includes(userDeptLower)) {
    return undefined; // Blocked: belong to another department
  }
  return grievance;
}

export async function updateGrievanceStatus(id: string, status: GrievanceStatus, note?: string): Promise<Grievance | undefined> {
  // We'll mock this for now since the backend might not have this endpoint yet.
  console.log(`Mock: Updated status for ${id} to ${status} with note ${note}`);
  return fetchGrievanceById(id);
}

export async function updateStaffDecision(id: string, decision: "ACCEPTED" | "MODIFIED" | "REJECTED", note?: string): Promise<Grievance | undefined> {
  console.log(`Mock: Updated staff decision for ${id} to ${decision} with note ${note}`);
  return fetchGrievanceById(id);
}

export async function addCitizenFeedback(id: string, resolved: boolean, _rating?: number, _comment?: string, _reopenReason?: string): Promise<Grievance | undefined> {
  console.log(`Mock: Added citizen feedback for ${id}. Resolved: ${resolved}`);
  return fetchGrievanceById(id);
}

/**
 * Maps the backend grievance schema to the frontend Grievance interface
 */
function mapBackendGrievanceToFrontend(bg: any): Grievance {
  return {
    id: bg.grievance_id || bg.id,
    citizenId: bg.user_id,
    citizenName: "Citizen", // Backend might not store name
    citizenPhone: "",
    category: bg.category as any || "Other",
    issueType: bg.category || "General",
    severity: bg.severity as any || "Medium",
    startDate: bg.created_at || new Date().toISOString(),
    frequency: "One time",
    description: bg.original_text || "",
    location: {
      lat: bg.latitude || 0,
      lng: bg.longitude || 0,
      address: bg.landmark || "",
      district: bg.district || "",
      state: "",
      pinCode: "",
      isVerified: true
    },
    evidence: {
      photos: []
    },
    aiAnalysis: {
      category: bg.category as any || "Other",
      issue: bg.category || "General",
      severity: bg.severity as any || "Medium",
      location: bg.district || "Unknown",
      confidence: 90,
      nearbyGrievances: 0,
      redZone: false,
      reasoning: "AI analysis from backend."
    },
    status: (bg.status || "SUBMITTED").toUpperCase() as GrievanceStatus,
    department: bg.domain || "Other",
    assignedTo: "Assigned Officer",
    createdAt: bg.created_at ? new Date(bg.created_at).toLocaleString() : new Date().toLocaleString(),
    updatedAt: bg.created_at ? new Date(bg.created_at).toLocaleString() : new Date().toLocaleString(),
    timeline: [
      {
        date: bg.created_at ? new Date(bg.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        title: "Grievance Submitted",
        description: "Grievance recorded via backend API.",
        completed: true,
      }
    ]
  };
}

/* User Storage Helpers */
const STORAGE_CITIZEN_KEY = "spin_citizen_user";
const STORAGE_STAFF_KEY = "spin_staff_user";

export function getStoredCitizenUser(): CitizenUser | null {
  const data = localStorage.getItem(STORAGE_CITIZEN_KEY);
  return data ? JSON.parse(data) : null;
}

export function setStoredCitizenUser(user: CitizenUser): void {
  localStorage.setItem(STORAGE_CITIZEN_KEY, JSON.stringify(user));
}

export function clearStoredCitizenUser(): void {
  localStorage.removeItem(STORAGE_CITIZEN_KEY);
}

export function getStoredStaffUser(): StaffUser | null {
  const data = localStorage.getItem(STORAGE_STAFF_KEY);
  return data ? JSON.parse(data) : null;
}

export function setStoredStaffUser(user: StaffUser): void {
  localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(user));
}
