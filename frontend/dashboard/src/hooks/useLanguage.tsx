import { createContext, useContext, useState, type ReactNode } from "react";

// ── BRICS Country Language Config ──────────────────────────────────────────
export type CountryCode = "AP" | "AR" | "AS" | "BR" | "CG" | "GA" | "GJ" | "HR" | "HP" | "JH" | "KA" | "KL" | "MP" | "MH" | "MN" | "ML" | "MZ" | "NL" | "OD" | "PB" | "RJ" | "SK" | "TN" | "TG" | "TR" | "UP" | "UT" | "WB" | "AN" | "CH" | "DN" | "DL" | "JK" | "LA" | "LD" | "PY";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  language: string;
  languageNative: string;
  flag: string;
  status: "active" | "proposed";
}

export const COUNTRIES: CountryConfig[] = [
  { code: "AP", name: "Andhra Pradesh", language: "Telugu", languageNative: "తెలుగు", flag: "🇮🇳", status: "proposed" },
  { code: "AR", name: "Arunachal Pradesh", language: "English", languageNative: "English", flag: "🇮🇳", status: "proposed" },
  { code: "AS", name: "Assam", language: "Assamese", languageNative: "অসমীয়া", flag: "🇮🇳", status: "proposed" },
  { code: "BR", name: "Bihar", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "CG", name: "Chhattisgarh", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "GA", name: "Goa", language: "Konkani", languageNative: "कोंकणी", flag: "🇮🇳", status: "proposed" },
  { code: "GJ", name: "Gujarat", language: "Gujarati", languageNative: "ગુજરાતી", flag: "🇮🇳", status: "proposed" },
  { code: "HR", name: "Haryana", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "HP", name: "Himachal Pradesh", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "JH", name: "Jharkhand", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "KA", name: "Karnataka", language: "Kannada", languageNative: "ಕನ್ನಡ", flag: "🇮🇳", status: "proposed" },
  { code: "KL", name: "Kerala", language: "Malayalam", languageNative: "മലയാളം", flag: "🇮🇳", status: "proposed" },
  { code: "MP", name: "Madhya Pradesh", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "MH", name: "Maharashtra", language: "Marathi", languageNative: "मराठी", flag: "🇮🇳", status: "active" },
  { code: "MN", name: "Manipur", language: "Manipuri", languageNative: "ꯃꯤꯇꯩꯂꯣꯟ", flag: "🇮🇳", status: "proposed" },
  { code: "ML", name: "Meghalaya", language: "English", languageNative: "English", flag: "🇮🇳", status: "proposed" },
  { code: "MZ", name: "Mizoram", language: "Mizo", languageNative: "Mizo ṭawng", flag: "🇮🇳", status: "proposed" },
  { code: "NL", name: "Nagaland", language: "English", languageNative: "English", flag: "🇮🇳", status: "proposed" },
  { code: "OD", name: "Odisha", language: "Odia", languageNative: "ଓଡ଼ିଆ", flag: "🇮🇳", status: "proposed" },
  { code: "PB", name: "Punjab", language: "Punjabi", languageNative: "ਪੰਜਾਬੀ", flag: "🇮🇳", status: "proposed" },
  { code: "RJ", name: "Rajasthan", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "SK", name: "Sikkim", language: "English", languageNative: "English", flag: "🇮🇳", status: "proposed" },
  { code: "TN", name: "Tamil Nadu", language: "Tamil", languageNative: "தமிழ்", flag: "🇮🇳", status: "proposed" },
  { code: "TG", name: "Telangana", language: "Telugu", languageNative: "తెలుగు", flag: "🇮🇳", status: "proposed" },
  { code: "TR", name: "Tripura", language: "Bengali", languageNative: "বাংলা", flag: "🇮🇳", status: "proposed" },
  { code: "UP", name: "Uttar Pradesh", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "UT", name: "Uttarakhand", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "WB", name: "West Bengal", language: "Bengali", languageNative: "বাংলা", flag: "🇮🇳", status: "proposed" },
  { code: "AN", name: "Andaman and Nicobar Islands", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "CH", name: "Chandigarh", language: "English", languageNative: "English", flag: "🇮🇳", status: "proposed" },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu", language: "Gujarati", languageNative: "ગુજરાતી", flag: "🇮🇳", status: "proposed" },
  { code: "DL", name: "Delhi", language: "Hindi", languageNative: "हिन्दी", flag: "🇮🇳", status: "proposed" },
  { code: "JK", name: "Jammu and Kashmir", language: "Urdu", languageNative: "اردو", flag: "🇮🇳", status: "proposed" },
  { code: "LA", name: "Ladakh", language: "English", languageNative: "English", flag: "🇮🇳", status: "proposed" },
  { code: "LD", name: "Lakshadweep", language: "Malayalam", languageNative: "മലയാളം", flag: "🇮🇳", status: "proposed" },
  { code: "PY", name: "Puducherry", language: "Tamil", languageNative: "தமிழ்", flag: "🇮🇳", status: "proposed" },
];

// ── Translation Schema ──────────────────────────────────────────────────────
export interface Translations {
  // Nav
  overview: string;
  how_it_works: string;
  intelligence: string;
  architecture: string;
  impact: string;
  enter_dashboard: string;
  citizen_label: string;
  select_region: string;
  adapts_spin_language: string;
  proposed_architecture_demo: string;

  // Hero
  hero_eyebrow: string;
  hero_headline_1: string;
  hero_headline_2: string;
  hero_body: string;
  pipeline_citizen: string;
  pipeline_ai: string;
  pipeline_geo: string;
  pipeline_policy: string;
  scroll_to_explore: string;

  // Problem (01)
  problem_label: string;
  problem_h2_1: string;
  problem_h2_2: string;
  problem_citizen_title: string;
  problem_gov_title: string;
  problem_citizen_items: string[];
  problem_gov_items: string[];
  problem_outcomes: string[];
  problem_result: string;

  // Transformation (02)
  trans_label: string;
  trans_h2_1: string;
  trans_h2_2: string;
  trans_stage_1_label: string;
  trans_quote: string;
  trans_stage_1_tags: string[];
  trans_stage_2_label: string;
  trans_table_rows: [string, string][];
  trans_stage_3_label: string;
  trans_complaints: string;
  trans_cluster: string;
  trans_red_zone: string;
  trans_identified: string;
  trans_spatial_tag: string;
  trans_stage_4_label: string;
  trans_recommended: string;
  trans_action: string;
  trans_pending: string;
  trans_disclaimer: string;
  trans_replay: string;

  // Process (03)
  process_label: string;
  process_h2_1: string;
  process_h2_2: string;
  process_checkpoint: string;
  process_stages: { num: string; title: string; desc: string; hitl: boolean }[];

  // Ecosystem (04)
  eco_label: string;
  eco_h2_1: string;
  eco_h2_2: string;
  eco_layers: { label: string; items: string[] }[];
  eco_bhashini_h3: string;
  eco_bhashini_body: string;
  eco_bhashini_flow: string[];

  // Agents (05)
  agents_label: string;
  agents_h2_1: string;
  agents_h2_2: string;
  agents_list: { num: string; name: string; role: string; input: string | null; process: string | null; output: string | null; hitl: boolean }[];
  agents_disclaimer: string;

  // Geospatial (06)
  geo_label: string;
  geo_h2_1: string;
  geo_h2_2: string;
  geo_redzone: string;
  geo_redzone_def: string;
  geo_data_rows: [string, string][];
  geo_rec_label: string;
  geo_rec_action: string;
  geo_rec_amount: string;
  geo_pending: string;

  // Impact (07)
  impact_label: string;
  impact_h2_1: string;
  impact_h2_2: string;
  impact_demo_badge: string;
  impact_metrics: { value: string; label: string; sub: string }[];

  // Footer
  footer_h2_1: string;
  footer_h2_2: string;
  footer_tagline: string;
  footer_explore: string;
  footer_view_dash: string;
  footer_built: string;
  footer_proto: string;

  // Dashboard & Citizen
  dash_title: string;
  dash_summary_title: string;
  dash_signals: string;
  dash_top_domain: string;
  dash_avg_severity: string;
  dash_red_zones: string;
  dash_budget_title: string;
  citizen_chat_title: string;
  citizen_placeholder: string;
}

// ── Translations Data ───────────────────────────────────────────────────────
const baseTranslations: Translations =   {
    overview: "Overview",
    how_it_works: "How It Works",
    intelligence: "Intelligence",
    architecture: "Architecture",
    impact: "Impact",
    enter_dashboard: "Dashboard →",
    citizen_label: "Citizen",
    select_region: "Select Region",
    adapts_spin_language: "Adapts SPIN to local language",
    proposed_architecture_demo: "PROPOSED ARCHITECTURE · UI DEMO ONLY",

    hero_eyebrow: "Digital Public Infrastructure / AI Governance",
    hero_headline_1: "Turning citizen voices",
    hero_headline_2: "into infrastructure intelligence.",
    hero_body: "SPIN connects citizen grievances with AI, geospatial intelligence and public infrastructure data to help governments understand where communities need investment most.",
    pipeline_citizen: "CITIZEN SIGNALS",
    pipeline_ai: "AI UNDERSTANDING",
    pipeline_geo: "GEOSPATIAL CONTEXT",
    pipeline_policy: "POLICY ACTION",
    scroll_to_explore: "Scroll to explore",

    problem_label: "The Problem",
    problem_h2_1: "The problem isn't",
    problem_h2_2: "a lack of data. It's disconnected data.",
    problem_citizen_title: "Citizen Signals",
    problem_gov_title: "Government Systems",
    problem_citizen_items: ["Voice", "Text", "Images", "Local languages", "GPS location"],
    problem_gov_items: ["CPGRAMS", "Infrastructure records", "PM Gati Shakti", "Demographics", "Planning data"],
    problem_outcomes: ["FRAGMENTED SIGNALS", "SILOED SYSTEMS", "REACTIVE DECISIONS"],
    problem_result: "Misaligned infrastructure investment.",

    trans_label: "See the Transformation",
    trans_h2_1: "What if every complaint",
    trans_h2_2: "became a planning signal?",
    trans_stage_1_label: "RAW SIGNAL",
    trans_quote: '"Hamare area mein pichle 3 hafton se paani nahi aa raha."',
    trans_stage_1_tags: ["HINDI", "UNSTRUCTURED", "VOICE INPUT"],
    trans_stage_2_label: "AI INTERPRETATION",
    trans_table_rows: [
      ["DOMAIN", "WATER"],
      ["SEVERITY", "HIGH"],
      ["LOCATION", "Sector 4"],
      ["ISSUE", "Supply disruption — 3 weeks"],
      ["LANGUAGE", "Hindi → English"],
    ],
    trans_stage_3_label: "SPATIAL INTELLIGENCE",
    trans_complaints: "Complaints",
    trans_cluster: "Cluster",
    trans_red_zone: "RED ZONE",
    trans_identified: "Identified",
    trans_spatial_tag: "Sector 4 East / WATER / HIGH DENSITY",
    trans_stage_4_label: "POLICY ACTION",
    trans_recommended: "Recommended Action",
    trans_action: "Increase water infrastructure allocation — Sector 4 East",
    trans_pending: "AWAITING POLICYMAKER DECISION",
    trans_disclaimer: "AI RECOMMENDS. HUMANS REMAIN ACCOUNTABLE.",
    trans_replay: "[ REPLAY ]",

    process_label: "The System",
    process_h2_1: "Six stages.",
    process_h2_2: "One coherent pipeline.",
    process_checkpoint: "HUMAN CHECKPOINT",
    process_stages: [
      { num: "01", title: "Citizen Input", desc: "Text, voice, images in any local language via WhatsApp, Telegram, or web.", hitl: false },
      { num: "02", title: "Language Processing", desc: "Bhashini detects language, transcribes speech, and translates to English for AI analysis.", hitl: false },
      { num: "03", title: "Location Verification", desc: "Human-in-the-loop gate confirms geographic context before processing.", hitl: true },
      { num: "04", title: "Semantic Understanding", desc: "Gemini agent extracts domain, classifies intent, and scores severity.", hitl: false },
      { num: "05", title: "Geospatial Correlation", desc: "Complaint is matched to infrastructure layers, demographics, and Gati Shakti data.", hitl: false },
      { num: "06", title: "Policy Action", desc: "Red Zone identification and budget recommendations surfaced for policymakers.", hitl: false },
    ],

    eco_label: "Data Ecosystem",
    eco_h2_1: "One signal is useful.",
    eco_h2_2: "A connected signal is powerful.",
    eco_layers: [
      { label: "CITIZEN SIGNALS", items: ["Voice", "Text", "Images", "Location"] },
      { label: "LANGUAGE & AI", items: ["Bhashini detection", "Speech recognition", "Translation", "Semantic parsing"] },
      { label: "GOVERNMENT DATA", items: ["CPGRAMS", "PM Gati Shakti", "Demographics", "Infrastructure layers"] },
      { label: "POLICY INTELLIGENCE", items: ["Red Zones", "Infrastructure gaps", "Priorities", "Recommendations"] },
    ],
    eco_bhashini_h3: "Language should never be a barrier to governance.",
    eco_bhashini_body: "SPIN accepts citizen input in any local language. Multilingual AI provides automatic detection, transcription, and translation prior to analysis. Every voice matters.",
    eco_bhashini_flow: ["Local voice", "Multilingual Engine", "English grievance", "AI analysis", "Policy insight"],

    agents_label: "The AI Pipeline",
    agents_h2_1: "Five stages.",
    agents_h2_2: "One intelligence pipeline.",
    agents_list: [
      { num: "01", name: "Root Agent", role: "Orchestrates the full pipeline workflow.", input: null, process: null, output: null, hitl: false },
      { num: "02", name: "Chatbot Intake Agent", role: "Receives and normalizes citizen input.", input: "Citizen message — any format, any language", process: null, output: "Normalized intake payload", hitl: false },
      { num: "03", name: "HITL Location Gate", role: "Human verifies that sufficient location data exists before pipeline continues.", input: "Intake payload", process: "Human confirms location context", output: "Location-confirmed complaint", hitl: true },
      { num: "04", name: "Semantic Parsing Agent", role: "Understands the complaint in depth.", input: '"The road outside our school has been broken for months."', process: "Entity extraction · Intent classification · Severity scoring", output: "ROAD / PUBLIC WORKS / HIGH", hitl: false },
      { num: "05", name: "Geospatial Correlation Agent", role: "Connects complaint with spatial and infrastructure data.", input: "Structured grievance + confirmed location", process: "Spatial join with infrastructure and demographics", output: "Cluster coordinates, Red Zone flag, infrastructure context", hitl: false },
      { num: "06", name: "Policy Dashboard Agent", role: "Converts analysis into actionable policy intelligence.", input: "Cluster analysis", process: null, output: "Executive summary · Budget recommendation · Red Zone map", hitl: false },
    ],
    agents_disclaimer: "AI RECOMMENDS. HUMANS REMAIN ACCOUNTABLE.",

    geo_label: "Geospatial Intelligence",
    geo_h2_1: "From individual complaints",
    geo_h2_2: "to geographic patterns.",
    geo_redzone: "RED ZONE",
    geo_redzone_def: "A geographic area where citizen complaints are highly concentrated, indicating a critical infrastructure gap.",
    geo_data_rows: [
      ["LOCATION", "Sector 4 East"],
      ["DOMAIN", "Water"],
      ["SIGNALS", "2,431"],
      ["DEMAND", "High"],
      ["RESPONSE", "Low"],
    ],
    geo_rec_label: "Recommended action",
    geo_rec_action: "Prioritize water network inspection and service restoration.",
    geo_rec_amount: "₹12 Cr",
    geo_pending: "AI RECOMMENDATION — PENDING APPROVAL",

    impact_label: "System Impact",
    impact_h2_1: "When demand becomes visible,",
    impact_h2_2: "decisions can become precise.",
    impact_demo_badge: "SYSTEM METRICS",
    impact_metrics: [
      { value: "4,200", label: "Signals Verified", sub: "CPGRAMS grievances" },
      { value: "14", label: "High-Priority Zones", sub: "Red zone clusters" },
      { value: "7 days", label: "Analysis Window", sub: "Rolling period" },
      { value: "22", label: "Indian Languages", sub: "Via Bhashini" },
      { value: "6", label: "AI Workflow Stages", sub: "Agent pipeline" },
    ],

    footer_h2_1: "Infrastructure should respond",
    footer_h2_2: "to where people need it.",
    footer_tagline: "Citizen signals → AI intelligence → spatial context → policy action",
    footer_explore: "Explore Intelligence",
    footer_view_dash: "View Dashboard",
    footer_built: "Built for Code for Communities 2 · Google for India",
    footer_proto: "SPIN is a prototype. Demo data only.",

    dash_title: "POLICYMAKER / LIVE INTELLIGENCE",
    dash_summary_title: "INTELLIGENCE SUMMARY",
    dash_signals: "Total Signals",
    dash_top_domain: "Top Domain",
    dash_avg_severity: "Avg Severity",
    dash_red_zones: "Red Zones",
    dash_budget_title: "BUDGET REALLOCATION RECOMMENDATIONS",
    citizen_chat_title: "Citizen Grievance Portal",
    citizen_placeholder: "Describe your grievance in any language...",
  };

const TRANSLATIONS: Record<CountryCode, Translations> = Object.fromEntries(
  COUNTRIES.map(c => [c.code, baseTranslations])
) as Record<CountryCode, Translations>;

// ── Context Provider ────────────────────────────────────────────────────────
interface LanguageContextValue {
  country: CountryConfig;
  t: Translations;
  setCountry: (code: CountryCode) => void;
}

const COUNTRY_TO_LANG: Record<CountryCode, string> = {
  AP: "te",
  AR: "en",
  AS: "as",
  BR: "hi",
  CG: "hi",
  GA: "gom",
  GJ: "gu",
  HR: "hi",
  HP: "hi",
  JH: "hi",
  KA: "kn",
  KL: "ml",
  MP: "hi",
  MH: "mr",
  MN: "mni-Mtei",
  ML: "en",
  MZ: "lus",
  NL: "en",
  OD: "or",
  PB: "pa",
  RJ: "hi",
  SK: "en",
  TN: "ta",
  TG: "te",
  TR: "bn",
  UP: "hi",
  UT: "hi",
  WB: "bn",
  AN: "hi",
  CH: "en",
  DN: "gu",
  DL: "hi",
  JK: "ur",
  LA: "en",
  LD: "ml",
  PY: "ta",
};


const LanguageContext = createContext<LanguageContextValue>({
  country: COUNTRIES[0],
  t: TRANSLATIONS["MH"],
  setCountry: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CountryCode>(() => {
    const saved = localStorage.getItem("spin_selected_country");
    return (saved as CountryCode) || "MH";
  });

  const country = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
  // Always use English for React state so Google Translate can cleanly translate the DOM
  const t = TRANSLATIONS["AP"];

  const setCountryHandler = (newCode: CountryCode) => {
    setCode(newCode);
    localStorage.setItem("spin_selected_country", newCode);
    
    const lang = COUNTRY_TO_LANG[newCode] || "en";

    // Set Google Translate cookies
    if (lang === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
    } else {
      document.cookie = `googtrans=/en/${lang}; path=/;`;
      document.cookie = `googtrans=/en/${lang}; domain=${window.location.hostname}; path=/;`;
    }

    // Trigger select element if present
    setTimeout(() => {
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        select.value = lang;
        select.dispatchEvent(new Event("change"));
      } else {
        window.location.reload();
      }
    }, 150);
  };

  return (
    <LanguageContext.Provider value={{ country, t, setCountry: setCountryHandler }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
