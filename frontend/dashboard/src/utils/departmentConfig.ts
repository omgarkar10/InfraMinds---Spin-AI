export const DEPARTMENTS = [
  "Water Supply",
  "Electricity",
  "Roads & Transport",
  "Sanitation",
  "Public Health",
  "Police / Law & Order",
  "Public Transport",
  "Education",
  "Housing & Urban Development",
  "Environment & Forestry",
  "Social Welfare & Pensions",
  "General Administration",
] as const;

export type DepartmentName = (typeof DEPARTMENTS)[number];

export const CATEGORY_TO_DEPARTMENT_MAP: Record<string, DepartmentName> = {
  "Water Supply": "Water Supply",
  "Drainage & Flooding": "Water Supply",
  "Drainage / Flooding": "Water Supply",
  "Roads & Potholes": "Roads & Transport",
  "Public Infrastructure": "Roads & Transport",
  "Electricity": "Electricity",
  "Electricity/Power": "Electricity",
  "Street Lighting": "Electricity",
  "Waste Management": "Sanitation",
  "Waste Management & Sanitation": "Sanitation",
  "Sanitation": "Sanitation",
  "Public Transport": "Public Transport",
  "Public Transport (Bus/Metro/Trains)": "Public Transport",
  "Healthcare & Hospitals": "Public Health",
  "Public Health": "Public Health",
  "Education": "Education",
  "Education (Public Schools)": "Education",
  "Identity/Documents (Passport, Aadhaar, Certificates)": "General Administration",
  "Banking & Financial Services": "Social Welfare & Pensions",
  "Pension & Social Security": "Social Welfare & Pensions",
  "Insurance Claims": "Social Welfare & Pensions",
  "Housing & Urban Development": "Housing & Urban Development",
  "Employment & Training": "General Administration",
  "Government Schemes & Subsidies": "General Administration",
  "Telecom & Mobile Network": "General Administration",
  "Environment & Trees": "Environment & Forestry",
  "Animal & Street Livestock": "Sanitation",
  "Public Safety & Law Enforcement": "Police / Law & Order",
  "Other": "General Administration",
  "Other (Uncategorized)": "General Administration",
};

/**
 * Normalizes any department string to the matching canonical department name.
 */
export function getNormalizedDepartment(dept: string | undefined | null): DepartmentName {
  if (!dept) return "General Administration";
  const cleaned = dept.trim();

  // Direct match
  const exactMatch = DEPARTMENTS.find(
    (d) => d.toLowerCase() === cleaned.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Keyword-based normalization for pre-existing legacy strings
  const lower = cleaned.toLowerCase();
  if (lower.includes("water") || lower.includes("drain")) return "Water Supply";
  if (lower.includes("power") || lower.includes("electric") || lower.includes("light")) return "Electricity";
  if (lower.includes("road") || lower.includes("pothole") || lower.includes("pwd")) return "Roads & Transport";
  if (lower.includes("sanitat") || lower.includes("waste") || lower.includes("garbage")) return "Sanitation";
  if (lower.includes("health") || lower.includes("hospital")) return "Public Health";
  if (lower.includes("police") || lower.includes("safety") || lower.includes("law")) return "Police / Law & Order";
  if (lower.includes("transport") || lower.includes("bus") || lower.includes("metro")) return "Public Transport";
  if (lower.includes("school") || lower.includes("educat")) return "Education";
  if (lower.includes("hous") || lower.includes("urban") || lower.includes("rera")) return "Housing & Urban Development";
  if (lower.includes("tree") || lower.includes("envir")) return "Environment & Forestry";
  if (lower.includes("pension") || lower.includes("bank") || lower.includes("welfare")) return "Social Welfare & Pensions";

  return "General Administration";
}

/**
 * Returns the canonical department assigned to a given grievance category or issue string.
 */
export function getDepartmentForCategory(category: string): DepartmentName {
  if (CATEGORY_TO_DEPARTMENT_MAP[category]) {
    return CATEGORY_TO_DEPARTMENT_MAP[category];
  }
  return getNormalizedDepartment(category);
}
