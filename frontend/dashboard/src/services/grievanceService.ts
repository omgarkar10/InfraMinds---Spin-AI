import type {
  Grievance,
  CitizenUser,
  StaffUser,
  GrievanceStatus,
} from "../types";
import { getNormalizedDepartment } from "../utils/departmentConfig";

const STORAGE_GRIEVANCES_KEY = "spin_grievances_v1";
const STORAGE_CITIZEN_KEY = "spin_citizen_user_v1";
const STORAGE_STAFF_KEY = "spin_staff_user_v1";

const INITIAL_SEED_GRIEVANCES: Grievance[] = [
  // WATER SUPPLY DEPARTMENT
  {
    id: "SPIN-2026-WTR001",
    citizenId: "cit-101",
    citizenName: "Ramesh Sharma",
    citizenPhone: "+91 98765 43210",
    category: "Water Supply",
    issueType: "Pipeline leakage / burst",
    severity: "High",
    startDate: "2026-08-20",
    frequency: "Continuous",
    description: "Main feeder water pipe burst causing heavy leakage near Sector 4 underground reservoir.",
    location: {
      lat: 18.5204,
      lng: 73.8567,
      address: "Near Water Tank, Sector 4, Kothrud",
      district: "Pune",
      state: "Maharashtra",
      pinCode: "411038",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-water-leak.jpg"],
      voiceNoteUrl: "/demo-audio-hindi.mp3",
      voiceText: "Pani ki pipe phat gayi hai raste par",
      documentName: "Leakage_Photo.jpg",
    },
    aiAnalysis: {
      category: "Water Supply",
      issue: "Pipeline leakage / burst",
      severity: "High",
      location: "Pune / Ward 14",
      confidence: 96,
      nearbyGrievances: 42,
      redZone: true,
      reasoning: "High volume pressure leak detected near critical distribution node impacting 14,000 residents.",
    },
    status: "SUBMITTED",
    department: "Water Supply",
    assignedTo: "Executive Engineer (Water Supply)",
    createdAt: "20 Aug 2026, 09:30 AM",
    updatedAt: "20 Aug 2026, 09:30 AM",
    timeline: [
      {
        date: "20 AUG",
        title: "Grievance Submitted",
        description: "Grievance recorded on SPIN Citizen Portal.",
        completed: true,
      },
    ],
    decisionStatus: "PENDING",
  },
  {
    id: "SPIN-2026-WTR002",
    citizenId: "cit-102",
    citizenName: "Priya Nair",
    citizenPhone: "+91 98123 45678",
    category: "Water Supply",
    issueType: "Contaminated water",
    severity: "Critical",
    startDate: "2026-08-18",
    frequency: "Daily",
    description: "Muddy and foul smelling tap water supplied during morning supply hours in Block B.",
    location: {
      lat: 18.5314,
      lng: 73.8446,
      address: "Block B, Shivajinagar",
      district: "Pune",
      state: "Maharashtra",
      pinCode: "411005",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-dirty-water.jpg"],
      documentName: "Sample_Test_Report.pdf",
    },
    aiAnalysis: {
      category: "Water Supply",
      issue: "Contaminated water",
      severity: "Critical",
      location: "Pune / Ward 8",
      confidence: 94,
      nearbyGrievances: 19,
      redZone: true,
      reasoning: "Public health hazard: Possible cross-contamination between sewage line and clean water network.",
    },
    status: "UNDER_REVIEW",
    department: "Water Supply",
    assignedTo: "Senior Chemist & Water Inspector",
    createdAt: "18 Aug 2026, 08:15 AM",
    updatedAt: "19 Aug 2026, 11:00 AM",
    timeline: [
      {
        date: "18 AUG",
        title: "Grievance Submitted",
        description: "Grievance recorded on SPIN Citizen Portal.",
        completed: true,
      },
      {
        date: "19 AUG",
        title: "Under Department Review",
        description: "Water quality sample dispatch initiated.",
        completed: true,
      },
    ],
    decisionStatus: "ACCEPTED",
  },

  // ELECTRICITY DEPARTMENT
  {
    id: "SPIN-2026-ELE001",
    citizenId: "cit-103",
    citizenName: "Amit Patel",
    citizenPhone: "+91 97654 32109",
    category: "Electricity",
    issueType: "Transformer failure / sparks",
    severity: "Critical",
    startDate: "2026-08-22",
    frequency: "Continuous",
    description: "Local distribution transformer sparking violently with frequent tripping in industrial pocket.",
    location: {
      lat: 19.076,
      lng: 72.8777,
      address: "Industrial Area Gate 3, Kurla West",
      district: "Mumbai",
      state: "Maharashtra",
      pinCode: "400070",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-transformer-spark.jpg"],
    },
    aiAnalysis: {
      category: "Electricity",
      issue: "Transformer failure / sparks",
      severity: "Critical",
      location: "Mumbai / Kurla Zone",
      confidence: 98,
      nearbyGrievances: 28,
      redZone: true,
      reasoning: "Immediate fire and safety hazard to adjacent commercial units.",
    },
    status: "INSPECTION_SCHEDULED",
    department: "Electricity",
    assignedTo: "Sub-Divisional Engineer (Electrical)",
    createdAt: "22 Aug 2026, 06:45 PM",
    updatedAt: "23 Aug 2026, 09:00 AM",
    timeline: [
      {
        date: "22 AUG",
        title: "Grievance Submitted",
        description: "Grievance recorded on SPIN Citizen Portal.",
        completed: true,
      },
      {
        date: "23 AUG",
        title: "Inspection Team Dispatched",
        description: "Emergency electrical line maintenance team assigned.",
        completed: true,
      },
    ],
    decisionStatus: "ACCEPTED",
  },
  {
    id: "SPIN-2026-ELE002",
    citizenId: "cit-104",
    citizenName: "Sunita Rao",
    citizenPhone: "+91 99887 76655",
    category: "Street Lighting",
    issueType: "Dark stretch / No lights installed",
    severity: "Medium",
    startDate: "2026-08-15",
    frequency: "Daily",
    description: "Entire 800-meter bypass stretch has non-functional streetlights creating pedestrian safety concern.",
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: "Outer Ring Road Bypass, Indiranagar",
      district: "Bengaluru",
      state: "Karnataka",
      pinCode: "560038",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-dark-street.jpg"],
    },
    aiAnalysis: {
      category: "Street Lighting",
      issue: "Dark stretch / No lights installed",
      severity: "Medium",
      location: "Bengaluru / Ward 112",
      confidence: 91,
      nearbyGrievances: 15,
      redZone: false,
      reasoning: "Municipal lighting cable fault suspected across 12 consecutive poles.",
    },
    status: "SUBMITTED",
    department: "Electricity",
    assignedTo: "Assistant Engineer (Lighting Division)",
    createdAt: "15 Aug 2026, 09:10 PM",
    updatedAt: "15 Aug 2026, 09:10 PM",
    timeline: [
      {
        date: "15 AUG",
        title: "Grievance Submitted",
        description: "Grievance recorded on SPIN Citizen Portal.",
        completed: true,
      },
    ],
    decisionStatus: "PENDING",
  },

  // ROADS & TRANSPORT DEPARTMENT
  {
    id: "SPIN-2026-RD001",
    citizenId: "cit-105",
    citizenName: "Vikas Gupta",
    citizenPhone: "+91 98220 11223",
    category: "Roads & Potholes",
    issueType: "Pothole",
    severity: "High",
    startDate: "2026-08-10",
    frequency: "Continuous",
    description: "Deep 3-foot pothole on main arterial road causing vehicle damage and traffic bottlenecks.",
    location: {
      lat: 28.6139,
      lng: 77.209,
      address: "Near Ring Road Flyover, Lajpat Nagar",
      district: "New Delhi",
      state: "Delhi (NCT)",
      pinCode: "110024",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-pothole.jpg"],
    },
    aiAnalysis: {
      category: "Roads & Potholes",
      issue: "Pothole",
      severity: "High",
      location: "New Delhi / South Zone",
      confidence: 95,
      nearbyGrievances: 53,
      redZone: true,
      reasoning: "High traffic velocity corridor; multi-vehicle hazard score 8.8/10.",
    },
    status: "ACTION_TAKEN",
    department: "Roads & Transport",
    assignedTo: "Executive Engineer (Road Works)",
    createdAt: "10 Aug 2026, 11:30 AM",
    updatedAt: "21 Aug 2026, 04:00 PM",
    timeline: [
      {
        date: "10 AUG",
        title: "Grievance Submitted",
        description: "Grievance recorded on SPIN Citizen Portal.",
        completed: true,
      },
      {
        date: "21 AUG",
        title: "Bitumen Patchwork Executed",
        description: "Cold-mix asphalt application completed by PWD road crew.",
        completed: true,
      },
    ],
    decisionStatus: "ACCEPTED",
  },

  // SANITATION DEPARTMENT
  {
    id: "SPIN-2026-SAN001",
    citizenId: "cit-106",
    citizenName: "Ananya Deshmukh",
    citizenPhone: "+91 94230 99887",
    category: "Waste Management",
    issueType: "Garbage dump not cleared",
    severity: "High",
    startDate: "2026-08-17",
    frequency: "Daily",
    description: "Community waste bin uncleared for 5 consecutive days, overflowing onto public sidewalk.",
    location: {
      lat: 18.5204,
      lng: 73.8567,
      address: "Market Yard Chowk, Gultekdi",
      district: "Pune",
      state: "Maharashtra",
      pinCode: "411037",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-garbage-overflow.jpg"],
    },
    aiAnalysis: {
      category: "Waste Management",
      issue: "Garbage dump not cleared",
      severity: "High",
      location: "Pune / Ward 21",
      confidence: 97,
      nearbyGrievances: 31,
      redZone: true,
      reasoning: "Sanitation vector risk high due to unsegregated organic waste accumulation.",
    },
    status: "SUBMITTED",
    department: "Sanitation",
    assignedTo: "Sanitation Inspector (Zone 4)",
    createdAt: "17 Aug 2026, 07:45 AM",
    updatedAt: "17 Aug 2026, 07:45 AM",
    timeline: [
      {
        date: "17 AUG",
        title: "Grievance Submitted",
        description: "Grievance recorded on SPIN Citizen Portal.",
        completed: true,
      },
    ],
    decisionStatus: "PENDING",
  },

  // PUBLIC HEALTH DEPARTMENT
  {
    id: "SPIN-2026-HLT001",
    citizenId: "cit-107",
    citizenName: "Dr. K. S. Verma",
    citizenPhone: "+91 98450 12345",
    category: "Healthcare & Hospitals",
    issueType: "Medicine/service unavailability",
    severity: "High",
    startDate: "2026-08-19",
    frequency: "Occasional",
    description: "Shortage of essential anti-venom and emergency medicines at Primary Health Center.",
    location: {
      lat: 17.385,
      lng: 78.4867,
      address: "District PHC Campus, Charminar Zone",
      district: "Hyderabad",
      state: "Telangana",
      pinCode: "500002",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-phc.jpg"],
    },
    aiAnalysis: {
      category: "Healthcare & Hospitals",
      issue: "Medicine/service unavailability",
      severity: "High",
      location: "Hyderabad / South District",
      confidence: 93,
      nearbyGrievances: 12,
      redZone: false,
      reasoning: "Critical health supply chain delay identified in public health facility.",
    },
    status: "UNDER_REVIEW",
    department: "Public Health",
    assignedTo: "District Health Officer (DHO)",
    createdAt: "19 Aug 2026, 10:00 AM",
    updatedAt: "20 Aug 2026, 02:30 PM",
    timeline: [
      {
        date: "19 AUG",
        title: "Grievance Submitted",
        description: "Grievance recorded on SPIN Citizen Portal.",
        completed: true,
      },
    ],
    decisionStatus: "ACCEPTED",
  },

  // POLICE / LAW & ORDER DEPARTMENT
  {
    id: "SPIN-2026-POL001",
    citizenId: "cit-108",
    citizenName: "Rajesh Kumar",
    citizenPhone: "+91 99100 88776",
    category: "Public Safety & Law Enforcement",
    issueType: "Traffic signal not working",
    severity: "High",
    startDate: "2026-08-21",
    frequency: "Continuous",
    description: "Major 4-way intersection traffic light failure leading to chaotic near-miss accidents.",
    location: {
      lat: 23.0225,
      lng: 72.5714,
      address: "SG Highway Junction, Thaltej",
      district: "Ahmedabad",
      state: "Gujarat",
      pinCode: "380054",
      isVerified: true,
    },
    evidence: {
      photos: ["/demo-traffic-signal.jpg"],
    },
    aiAnalysis: {
      category: "Public Safety & Law Enforcement",
      issue: "Traffic signal not working",
      severity: "High",
      location: "Ahmedabad / West Zone",
      confidence: 96,
      nearbyGrievances: 24,
      redZone: true,
      reasoning: "High risk collision junction requires immediate traffic police deployment and signal repair.",
    },
    status: "INSPECTION_SCHEDULED",
    department: "Police / Law & Order",
    assignedTo: "Inspector (Traffic & Safety)",
    createdAt: "21 Aug 2026, 05:20 PM",
    updatedAt: "22 Aug 2026, 08:30 AM",
    timeline: [
      {
        date: "21 AUG",
        title: "Grievance Submitted",
        description: "Grievance recorded on SPIN Citizen Portal.",
        completed: true,
      },
      {
        date: "22 AUG",
        title: "Traffic Patrol Dispatched",
        description: "On-site manual traffic control deployed.",
        completed: true,
      },
    ],
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
    const list: Grievance[] = JSON.parse(data);
    if (!Array.isArray(list) || list.length === 0) {
      localStorage.setItem(STORAGE_GRIEVANCES_KEY, JSON.stringify(INITIAL_SEED_GRIEVANCES));
      return INITIAL_SEED_GRIEVANCES;
    }
    return list;
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

/**
 * Authorization & Filtering: Retrieve only grievances matching the staff member's department.
 * Admins/Policymakers receive all grievances system-wide.
 */
export function getStaffGrievances(staffUser: StaffUser): Grievance[] {
  const allGrievances = getStoredGrievances();
  if (isSuperAdmin(staffUser)) {
    return allGrievances;
  }
  const userDept = getNormalizedDepartment(staffUser.department);
  return allGrievances.filter(
    (g) => getNormalizedDepartment(g.department) === userDept
  );
}

/**
 * Authorized single grievance lookup for staff.
 * Rejects access if grievance belongs to another department and user is not admin.
 */
export function getStaffGrievanceById(id: string, staffUser: StaffUser): Grievance | undefined {
  const grievance = getGrievanceById(id);
  if (!grievance) return undefined;
  if (isSuperAdmin(staffUser)) return grievance;

  const userDept = getNormalizedDepartment(staffUser.department);
  const grievanceDept = getNormalizedDepartment(grievance.department);

  if (userDept !== grievanceDept) {
    return undefined; // Blocked: belong to another department
  }
  return grievance;
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
    id: "",
    name: "",
    employeeId: "",
    email: "",
    department: "",
    role: "Staff",
    isLoggedIn: false,
  };
}

export function setStoredStaffUser(user: StaffUser): void {
  localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(user));
}
