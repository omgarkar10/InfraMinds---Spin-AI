export interface RedZone {
  lat: number;
  lng: number;
  density: number;
  domain: InfrastructureDomain;
  district: string;
}

export type InfrastructureDomain = "Water" | "Road" | "Power" | "Rail" | "Telecom" | "None";

export type BudgetCategory =
  | "Water Supply"
  | "Roads & Potholes"
  | "Drainage / Flooding"
  | "Electricity"
  | "Waste Management"
  | "Street Lighting"
  | "Public Transport"
  | "Sanitation"
  | "Public Infrastructure"
  | "Other";

export interface WeeklyStats {
  district: string;
  total_complaints: number;
  top_domain: InfrastructureDomain;
  avg_severity: number;
  red_zone_count: number;
  period: string;
}

export interface DashboardSummary {
  executive_summary: string;
  weekly_stats: WeeklyStats;
}

export interface BudgetAllocation {
  domain: string;           // budget category label
  current_cr: number;
  proposed_cr: number;
  recommended_cr: number;   // AI-suggested budget
}

export interface PolicyActionRequest {
  grievance_id: string;
  user_id: string;
  target_language: string;
  action: "approved" | "rejected" | "reallocated";
  budget_cr?: number;
  message_en?: string;
}

/* =========================================================
   CITIZEN & STAFF PORTAL TYPES
   ========================================================= */

export type GrievanceCategory =
  | "Water Supply"
  | "Roads & Potholes"
  | "Drainage / Flooding"
  | "Electricity"
  | "Waste Management"
  | "Street Lighting"
  | "Public Transport"
  | "Sanitation"
  | "Public Infrastructure"
  | "Healthcare & Hospitals"
  | "Public Safety & Law Enforcement"
  | "Other";

export type GrievanceSeverity = "Low" | "Medium" | "High" | "Critical";

export type GrievanceStatus =
  | "SUBMITTED"
  | "AI_PROCESSING"
  | "DEPARTMENT_ROUTED"
  | "UNDER_REVIEW"
  | "INSPECTION_SCHEDULED"
  | "ACTION_TAKEN"
  | "RESOLVED"
  | "REOPENED";

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  district: string;
  state: string;
  pinCode: string;
  isVerified: boolean;
}

export interface EvidenceData {
  photos: string[];
  voiceNoteUrl?: string;
  voiceText?: string;
  documentName?: string;
}

export interface AIAnalysisData {
  category: GrievanceCategory;
  issue: string;
  severity: GrievanceSeverity;
  location: string;
  confidence: number; // e.g. 94
  nearbyGrievances: number; // e.g. 37
  redZone: boolean;
  reasoning: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface GrievanceFeedback {
  resolved: boolean;
  rating?: number;
  comment?: string;
  reopenReason?: string;
  submittedAt: string;
}

export interface Grievance {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  category: GrievanceCategory;
  issueType: string;
  severity: GrievanceSeverity;
  startDate: string;
  frequency: "One time" | "Occasional" | "Daily" | "Continuous";
  description: string;
  location: LocationData;
  evidence: EvidenceData;
  aiAnalysis: AIAnalysisData;
  status: GrievanceStatus;
  department: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  feedback?: GrievanceFeedback;
  staffNotes?: string[];
  decisionStatus?: "PENDING" | "ACCEPTED" | "MODIFIED" | "REJECTED";
}

export interface CitizenUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isLoggedIn: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  role: "Staff" | "Department Officer" | "Policymaker" | "Administrator";
  isLoggedIn: boolean;
}

