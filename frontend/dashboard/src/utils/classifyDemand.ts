/**
 * Local demand classifier — maps English (or already-translated) citizen text
 * onto the form's category / issue lists without calling Gemini.
 */

export type ClassifiedDemand = {
  request_type: "existing_problem" | "new_development";
  category: string;
  specific_issue: string;
  description: string;
  landmark: string | null;
  confidence: number;
};

const NEW_DEVELOPMENT_CUES = [
  "new ", "need a", "needs a", "needed", "construct", "construction",
  "build", "propose", "proposed", "install", "installation", "required",
  "want a", "set up", "setup", "establish",
];

const EXISTING_PROBLEM_CUES = [
  "broken", "leak", "burst", "pothole", "not working", "damaged", "overflow",
  "no water", "cut off", "blocked", "clogged", "dirty", "contaminated",
  "outage", "power cut", "collapsed", "cracked", "stinking", "flooded",
];

const ISSUE_KEYWORDS: Record<string, Record<string, string[]>> = {
  "Water Supply": {
    "Pipeline leakage / burst": ["leak", "burst", "pipe burst", "pipeline leak", "water leaking"],
    "No water supply": ["no water", "water cut", "no drinking water", "without water"],
    "Low pressure": ["low pressure", "weak water", "trickle"],
    "Contaminated water": ["dirty water", "contaminated", "muddy water", "smelly water"],
    "Irregular supply hours": ["irregular water", "water timing", "supply hours"],
    "New piped drinking water connection needed": ["new water connection", "piped water needed", "water connection"],
    "Water storage tank required": ["water tank", "storage tank", "overhead tank"],
    "Other water supply issue": ["water", "pipeline", "tap", "borewell", "pani"],
  },
  "Electricity": {
    "Frequent load shedding": ["load shedding", "power cut", "outage"],
    "Transformer failure / sparks": ["transformer", "spark", "short circuit"],
    "High/Low voltage fluctuation": ["voltage", "fluctuation"],
    "Dangling power lines": ["dangling", "hanging wire", "loose wire"],
    "Agricultural power feeder line needed": ["agricultural power", "farm power", "feeder"],
    "Substation capacity upgrade needed": ["substation"],
    "Street light not working": ["street light", "streetlight", "lamp post"],
    "Other electrical issue": ["electric", "electricity", "power", "bijli"],
  },
  "Roads & Transport": {
    "Pothole": ["pothole", "gaddha", "crater"],
    "Damaged asphalt road": ["damaged road", "broken road", "asphalt"],
    "Road blockage / debris": ["road block", "debris", "obstruction"],
    "Missing traffic signage": ["signage", "sign board", "traffic sign"],
    "Unsafe road condition": ["unsafe road", "accident prone"],
    "All-weather paved road needed": ["paved road", "new road", "all-weather", "need a road"],
    "Other roads & transport issue": ["road", "street", "highway", "sadak"],
  },
  "Sanitation": {
    "Garbage dump not cleared": ["garbage dump", "dump not cleared"],
    "Overflowing community bin": ["overflowing bin", "full bin"],
    "Illegal waste dumping": ["illegal dump", "dumping waste"],
    "Hazardous waste on public land": ["hazardous waste", "medical waste"],
    "Door-to-door waste collection needed": ["door to door", "waste collection"],
    "Clogged drainage pipe": ["clogged drain", "blocked drain", "gutter"],
    "Overflowing sewer main": ["sewer", "sewage overflow", "sewage"],
    "Other sanitation issue": ["garbage", "waste", "trash", "sanitation", "drain", "flood"],
  },
  "Public Health": {
    "Primary Health Centre (PHC) building needed": ["phc", "health centre", "health center", "new hospital", "clinic needed"],
    "Hospital staff / doctor shortage": ["doctor shortage", "no doctor", "staff shortage"],
    "Medicine unavailability": ["medicine", "no medicine"],
    "Emergency ambulance delay": ["ambulance"],
    "Other public health issue": ["hospital", "health", "clinic", "dengue", "mosquito"],
  },
  "Police / Law & Order": {
    "Traffic signal installation needed": ["traffic signal", "signal light"],
    "CCTV surveillance cameras needed": ["cctv", "camera", "surveillance"],
    "Police checkpost / beat patrol required": ["police station", "checkpost", "patrol"],
    "Other law and order issue": ["police", "theft", "crime", "safety"],
  },
  "Public Transport": {
    "Irregular bus schedule": ["bus late", "irregular bus", "bus schedule"],
    "Damaged bus shelter": ["bus shelter", "bus stand damaged"],
    "Overcrowded transit route": ["overcrowded bus", "crowded"],
    "New public bus stop / route required": ["new bus stop", "bus route", "bus stop needed"],
    "Other public transport issue": ["bus", "metro", "train", "transport"],
  },
  "Education": {
    "Government school classroom construction": ["classroom", "new school", "school building"],
    "Drinking water & sanitation in school": ["school toilet", "school water"],
    "Digital classroom / computer lab needed": ["computer lab", "digital classroom", "smart class"],
    "Other education issue": ["school", "teacher", "education", "college", "anganwadi"],
  },
  "Housing & Urban Development": {
    "Public park / open gym installation": [
      "park", "playground", "garden", "open gym", "children park", "public park", "play area",
    ],
    "Community hall / Panchayat building needed": ["community hall", "panchayat", "meeting hall"],
    "Bridge or culvert construction required": ["bridge", "culvert"],
    "Other urban development issue": ["housing", "slum", "urban development"],
  },
  "Environment & Forestry": {
    "Tree plantation needed": ["tree plantation", "plant trees", "afforestation"],
    "Air pollution complaint": ["air pollution", "smog"],
    "Illegal tree felling": ["tree felling", "cutting trees"],
    "Other environment issue": ["pollution", "forest", "environment"],
  },
  "Social Welfare & Pensions": {
    "Old age pension issue": ["pension", "old age"],
    "Disability support needed": ["disability", "divyang"],
    "Other social welfare issue": ["welfare", "ration"],
  },
  "General Administration": {
    "Certificate issuance delay": ["certificate", "birth certificate", "caste certificate"],
    "Public service grievance": ["office delay", "government office"],
    "Other general administration issue": ["administration", "tehsil"],
  },
  "Other": {
    "Other civic infrastructure need": ["infrastructure", "civic"],
    "Other community development proposal": ["community development"],
  },
};

export function classifyDemandText(text: string): ClassifiedDemand {
  const description = text.trim();
  const lower = ` ${description.toLowerCase()} `;

  let bestCategory = "Other";
  let bestIssue = "Other civic infrastructure need";
  let bestScore = 0;

  for (const [category, issues] of Object.entries(ISSUE_KEYWORDS)) {
    for (const [issue, keywords] of Object.entries(issues)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          score += Math.max(2, keyword.split(/\s+/).length * 3);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
        bestIssue = issue;
      }
    }
  }

  const existingHits = EXISTING_PROBLEM_CUES.filter((cue) => lower.includes(cue)).length;
  const newHits = NEW_DEVELOPMENT_CUES.filter((cue) => lower.includes(cue)).length;
  const request_type: ClassifiedDemand["request_type"] =
    existingHits > newHits ? "existing_problem" : newHits > 0 ? "new_development" : existingHits > 0 ? "existing_problem" : "existing_problem";

  // "need a new park" is clearly a new facility even if no repair words exist.
  const confidence = bestScore >= 6 ? 0.92 : bestScore >= 3 ? 0.78 : bestScore > 0 ? 0.55 : 0.2;

  return {
    request_type,
    category: bestCategory,
    specific_issue: bestIssue,
    description,
    landmark: extractLandmark(description),
    confidence,
  };
}

export function mapBackendCategoryToFrontend(raw: string | null | undefined, fallback = "Other"): string {
  if (!raw) return fallback;
  const keys = Object.keys(ISSUE_KEYWORDS);
  const lower = raw.toLowerCase().trim();
  const exact = keys.find((key) => key.toLowerCase() === lower);
  if (exact) return exact;

  const aliases: Record<string, string> = {
    water: "Water Supply",
    water_supply: "Water Supply",
    electricity: "Electricity",
    roads: "Roads & Transport",
    roads_transport: "Roads & Transport",
    "roads & potholes": "Roads & Transport",
    garbage: "Sanitation",
    sanitation: "Sanitation",
    drainage: "Sanitation",
    "waste management": "Sanitation",
    street_lighting: "Electricity",
    "street lighting": "Electricity",
    public_health: "Public Health",
    "public health": "Public Health",
    education: "Education",
    housing: "Housing & Urban Development",
    "housing & urban development": "Housing & Urban Development",
    environment: "Environment & Forestry",
    other: "Other",
    police: "Police / Law & Order",
    public_transport: "Public Transport",
    social_welfare: "Social Welfare & Pensions",
    general: "General Administration",
  };
  return aliases[lower] || aliases[lower.replace(/[\s&/]+/g, "_")] || fallback;
}

export function matchIssueInCategory(category: string, candidate: string | null | undefined, description: string): string {
  const issues = Object.keys(ISSUE_KEYWORDS[category] || {});
  if (!issues.length) return candidate || "";
  if (candidate && issues.includes(candidate)) return candidate;

  const local = classifyDemandText(description);
  if (local.category === category && issues.includes(local.specific_issue)) {
    return local.specific_issue;
  }
  const lower = (candidate || description).toLowerCase();
  const fuzzy = issues.find((issue) => lower.includes(issue.toLowerCase()) || issue.toLowerCase().includes(lower));
  return fuzzy || issues[0];
}

function extractLandmark(text: string): string | null {
  const match = text.match(/\b(?:near|opposite|behind|beside|in front of)\s+(.+)$/i);
  if (!match) return null;
  const landmark = match[1].replace(/[.!?].*$/, "").trim();
  return landmark.length >= 3 ? landmark : null;
}
