import type {
  Grievance,
  CitizenUser,
  StaffUser,
  GrievanceStatus,
} from "../types";

const STORAGE_GRIEVANCES_KEY = "spin_grievances_v1";
const STORAGE_CITIZEN_KEY = "spin_citizen_user_v1";
const STORAGE_STAFF_KEY = "spin_staff_user_v1";

/* Initial Seed Data — Includes the Pune Water Supply grievance referenced in prompt */
const INITIAL_SEED_GRIEVANCES: Grievance[] = [
  {
    id: "SPIN-2026-004821",
    citizenId: "cit-001",
    citizenName: "Ramesh Kulkarni",
    citizenPhone: "+91 98230 41092",
    category: "Water Supply",
    issueType: "Pipeline leakage / No supply",
    severity: "High",
    startDate: "2026-08-01",
    frequency: "Continuous",
    description: "Main water supply line W-402 has burst near Sector 4 East. No drinking water for 3 weeks. Tankers are not arriving regularly.",
    location: {
      lat: 18.5204,
      lng: 73.8567,
      address: "Main Road, Sector 4 East, Pune Ward 14",
      district: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-water-leak.jpg"],
      voiceNoteUrl: "/demo-audio-hindi.mp3",
      voiceText: "पानी की मुख्य लाइन पिछले 3 हफ़्तों से टूटी हुई है। सेक्टर 4 में पीने का पानी नहीं आ रहा है।",
      documentName: "Resident_Petition_Ward14.pdf",
    },
    aiAnalysis: {
      category: "Water Supply",
      issue: "Major Municipal Pipeline Rupture",
      severity: "High",
      location: "Pune East / Ward 14",
      confidence: 94,
      nearbyGrievances: 37,
      redZone: true,
      reasoning: "Grievance density reached 3.1 complaints/km² (Baseline: 0.8/km²). 84% cite line W-402 rupture affecting 14,000 residents.",
    },
    status: "UNDER_REVIEW",
    department: "Pune Municipal Water Supply Dept.",
    assignedTo: "Executive Engineer S. V. Patil",
    createdAt: "2026-08-18 10:30 AM",
    updatedAt: "2026-08-22 04:15 PM",
    timeline: [
      { date: "18 AUG 2026", title: "Grievance Submitted", description: "Citizen voice grievance recorded and intake normalized.", completed: true },
      { date: "18 AUG 2026", title: "AI Classification Completed", description: "Bhashini translated audio; Gemini parsed water pipeline rupture entity.", completed: true },
      { date: "19 AUG 2026", title: "Forwarded to Water Department", description: "Spatial correlation identified 37 matching signals near Segment W-402.", completed: true },
      { date: "21 AUG 2026", title: "Department Review", description: "District executive summary generated for policy and budget approval.", completed: true },
      { date: "23 AUG 2026", title: "Field Inspection Scheduled", description: "Technical repair team dispatched to inspect W-402 main line valve.", completed: false },
    ],
    decisionStatus: "PENDING",
  },
  {
    id: "SPIN-2026-003910",
    citizenId: "cit-001",
    citizenName: "Ramesh Kulkarni",
    citizenPhone: "+91 98230 41092",
    category: "Roads & Potholes",
    issueType: "Pothole / Road damage",
    severity: "Medium",
    startDate: "2026-08-10",
    frequency: "Daily",
    description: "Deep potholes on MG Road stretch causing traffic congestion and two-wheeler accidents.",
    location: {
      lat: 18.5167,
      lng: 73.8500,
      address: "MG Road Junction, Camp Area",
      district: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-pothole.jpg"],
    },
    aiAnalysis: {
      category: "Roads & Potholes",
      issue: "Asphalt Degradation & Traffic Hazard",
      severity: "Medium",
      location: "Pune Camp",
      confidence: 88,
      nearbyGrievances: 14,
      redZone: false,
      reasoning: "14 grievances logged along 1.2 km road stretch following monsoon spell.",
    },
    status: "INSPECTION_SCHEDULED",
    department: "Public Works Department (PWD)",
    assignedTo: "Assistant Engineer K. Deshmukh",
    createdAt: "2026-08-12 02:15 PM",
    updatedAt: "2026-08-20 11:00 AM",
    timeline: [
      { date: "12 AUG 2026", title: "Grievance Submitted", description: "Submitted via SPIN Citizen Portal.", completed: true },
      { date: "13 AUG 2026", title: "AI Classification Completed", description: "Category verified as Road Infrastructure.", completed: true },
      { date: "15 AUG 2026", title: "Routed to PWD", description: "Assigned to Ward Road Maintenance Cell.", completed: true },
      { date: "20 AUG 2026", title: "Inspection Scheduled", description: "Tar resurfacing work order queued.", completed: true },
    ],
    decisionStatus: "ACCEPTED",
  },
  {
    id: "SPIN-2026-002104",
    citizenId: "cit-002",
    citizenName: "Priya Sharma",
    citizenPhone: "+91 99102 38475",
    category: "Electricity",
    issueType: "Frequent load shedding / Transformer failure",
    severity: "High",
    startDate: "2026-07-28",
    frequency: "Daily",
    description: "Transformer spark causing 6-hour power outage daily in Sector 2 Residential colony.",
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: "Sector 2, Outer Ring Road",
      district: "Delhi",
      state: "Delhi",
      pinCode: "110001",
      isVerified: true,
    },
    evidence: {
      photos: [],
    },
    aiAnalysis: {
      category: "Electricity",
      issue: "Substation Transformer Overload",
      severity: "High",
      location: "North Delhi / Sector 2",
      confidence: 91,
      nearbyGrievances: 22,
      redZone: true,
      reasoning: "Peak summer load causing recurrent thermal trips on Substation 4B.",
    },
    status: "RESOLVED",
    department: "State Power Distribution Corp",
    assignedTo: "Junior Engineer A. Saxena",
    createdAt: "2026-07-30 09:00 AM",
    updatedAt: "2026-08-15 05:00 PM",
    timeline: [
      { date: "30 JUL 2026", title: "Grievance Submitted", description: "Reported online.", completed: true },
      { date: "02 AUG 2026", title: "Technical Team Inspection", description: "Substation inspected.", completed: true },
      { date: "10 AUG 2026", title: "Transformer Replacement", description: "New 500kVA transformer installed.", completed: true },
      { date: "15 AUG 2026", title: "Resolved & Verified", description: "Power supply restored permanently.", completed: true },
    ],
    feedback: {
      resolved: true,
      rating: 5,
      comment: "Thank you, transformer was replaced and electricity is working smoothly now!",
      submittedAt: "2026-08-16 10:00 AM",
    },
    decisionStatus: "ACCEPTED",
  },
];

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
    name: "Ramesh Kulkarni",
    phone: "+91 98230 41092",
    isLoggedIn: false,
  };
}

export function setStoredCitizenUser(user: CitizenUser): void {
  localStorage.setItem(STORAGE_CITIZEN_KEY, JSON.stringify(user));
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
