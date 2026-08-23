import type {
  Grievance,
  CitizenUser,
  StaffUser,
  GrievanceStatus,
} from "../types";

const STORAGE_GRIEVANCES_KEY = "spin_grievances_v1";
const STORAGE_CITIZEN_KEY = "spin_citizen_user_v1";
const STORAGE_STAFF_KEY = "spin_staff_user_v1";

const INITIAL_SEED_GRIEVANCES: Grievance[] = [];

/* Helper functions for LocalStorage management */
export function getStoredGrievances(): Grievance[] {
  const data = localStorage.getItem(STORAGE_GRIEVANCES_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_GRIEVANCES_KEY, JSON.stringify(INITIAL_SEED_GRIEVANCES));
    return INITIAL_SEED_GRIEVANCES;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_SEED_GRIEVANCES;
  }
}

export function clearStoredGrievances(): void {
  localStorage.removeItem(STORAGE_GRIEVANCES_KEY);
}

export function saveGrievance(grievance: Grievance): void {
  const list = getStoredGrievances();
  const index = list.findIndex((g) => g.id === grievance.id);
  if (index >= 0) {
    list[index] = grievance;
  } else {
    list.unshift(grievance);
  }
  localStorage.setItem(STORAGE_GRIEVANCES_KEY, JSON.stringify(list));
}

export function getGrievanceById(id: string): Grievance | undefined {
  const list = getStoredGrievances();
  return list.find((g) => g.id.toLowerCase() === id.toLowerCase());
}

export function updateGrievanceStatus(id: string, status: GrievanceStatus, note?: string): Grievance | undefined {
  const list = getStoredGrievances();
  const g = list.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (g) {
    g.status = status;
    g.updatedAt = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    if (note) {
      g.staffNotes = g.staffNotes || [];
      g.staffNotes.push(`[${g.updatedAt}] ${note}`);
    }
    // Add timeline event
    g.timeline.push({
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase(),
      title: `Status Changed to ${status.replace(/_/g, " ")}`,
      description: note || `Government department updated status to ${status}.`,
      completed: true,
    });
    saveGrievance(g);
    return g;
  }
  return undefined;
}

export function updateStaffDecision(id: string, decision: "ACCEPTED" | "MODIFIED" | "REJECTED", note?: string): Grievance | undefined {
  const list = getStoredGrievances();
  const g = list.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (g) {
    g.decisionStatus = decision;
    if (decision === "ACCEPTED") {
      g.status = "UNDER_REVIEW";
    } else if (decision === "REJECTED") {
      g.status = "RESOLVED";
    }
    g.updatedAt = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    if (note) {
      g.staffNotes = g.staffNotes || [];
      g.staffNotes.push(`[${g.updatedAt}] Decision (${decision}): ${note}`);
    }
    saveGrievance(g);
    return g;
  }
  return undefined;
}

export function addCitizenFeedback(id: string, resolved: boolean, rating?: number, comment?: string, reopenReason?: string): Grievance | undefined {
  const list = getStoredGrievances();
  const g = list.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (g) {
    g.feedback = {
      resolved,
      rating,
      comment,
      reopenReason,
      submittedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    };
    if (!resolved) {
      g.status = "REOPENED";
      g.timeline.push({
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase(),
        title: "Grievance Reopened by Citizen",
        description: reopenReason || "Citizen flagged that the issue persists.",
        completed: true,
      });
    } else {
      g.status = "RESOLVED";
      g.timeline.push({
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase(),
        title: "Citizen Feedback Received",
        description: `Citizen marked issue as resolved (${rating || 5}/5 stars).`,
        completed: true,
      });
    }
    saveGrievance(g);
    return g;
  }
  return undefined;
}

/* User Session Helpers */
export function getStoredCitizenUser(): CitizenUser {
  const data = localStorage.getItem(STORAGE_CITIZEN_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      /* fallback below */
    }
  }
  return {
    id: "cit-001",
    name: "",
    phone: "",
    isLoggedIn: false,
  };
}

export function setStoredCitizenUser(user: CitizenUser): void {
  localStorage.setItem(STORAGE_CITIZEN_KEY, JSON.stringify(user));
}

export function clearStoredCitizenUser(): void {
  localStorage.removeItem(STORAGE_CITIZEN_KEY);
}

export function getStoredStaffUser(): StaffUser {
  const data = localStorage.getItem(STORAGE_STAFF_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      /* fallback below */
    }
  }
  return {
    id: "staff-881",
    name: "Dr. A. V. Deshpande",
    employeeId: "MH-GOV-8812",
    email: "officer.infrastructure@pune.gov.in",
    department: "Municipal Infrastructure & Public Works",
    role: "Department Officer",
    isLoggedIn: false,
  };
}

export function setStoredStaffUser(user: StaffUser): void {
  localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(user));
}
