import { SectionBase } from "./SectionBase";
import "./EcosystemSection.css";

interface Layer {
  title: string;
  badge: "LIVE" | "CONNECTED" | "MOCK" | "DEMO DATA" | "SIMULATED";
  badgeClass: string;
  items: string[];
  description: string;
}

const LAYERS: Layer[] = [
  {
    title: "CITIZEN SIGNAL LAYER",
    badge: "LIVE",
    badgeClass: "badge-green",
    items: ["Natural Voice Audio", "WhatsApp / Web Intake", "GPS Metadata", "Photo Evidence"],
    description: "Accepts citizen input across channels without requiring form filling.",
  },
  {
    title: "MULTILINGUAL LANGUAGE LAYER",
    badge: "CONNECTED",
    badgeClass: "badge-blue",
    items: ["Bhashini ASR Model", "Language Detection", "Automated Speech Translation", "Standard English JSON"],
    description: "Transcribes and translates 22 Indian regional languages prior to analysis.",
  },
  {
    title: "GOVERNANCE DATA INTEGRATION",
    badge: "DEMO DATA",
    badgeClass: "badge-amber",
    items: ["CPGRAMS Grievances", "State Complaint Portals", "Municipal Service Tickets", "Department Records"],
    description: "Harmonizes fragmented departmental complaint data into a unified schema.",
  },
  {
    title: "GEOSPATIAL & INFRASTRUCTURE DATA",
    badge: "CONNECTED",
    badgeClass: "badge-blue",
    items: ["PM Gati Shakti Maps", "Pipe & Road Layers", "Census Demographics", "Satellite Grid Overlay"],
    description: "Overlays grievances directly onto physical infrastructure networks.",
  },
  {
    title: "SPIN AI INTELLIGENCE LAYER",
    badge: "LIVE",
    badgeClass: "badge-orange",
    items: ["Gemini Semantic Agent", "Density Clustering", "Red Zone Threshold Engine", "Evidence Synthesizer"],
    description: "Processes signals to identify macro infrastructure demand patterns.",
  },
  {
    title: "POLICY OUTPUT & GOVERNANCE",
    badge: "SIMULATED",
    badgeClass: "badge-gray",
    items: ["Executive Summaries", "Red Zone Dashboards", "Budget Reallocations", "Citizen Updates"],
    description: "Delivers evidence-backed recommendations for policymaker approval.",
  },
];

export function EcosystemSection() {
  return (
    <SectionBase id="intelligence" number="04" label="THE DATA ECOSYSTEM">
      <div className="ecosystem-heading">
        <h2 className="editorial-h2">
          One signal is useful.<br />
          <span className="problem-h2-highlight">A connected ecosystem is transformative.</span>
        </h2>
        <p className="body-lg ecosystem-subtitle">
          SPIN integrates citizen input, multilingual AI, governance records, and spatial mapping into a single sovereign data architecture.
        </p>
      </div>

      {/* Layered Stack */}
      <div className="ecosystem-stack">
        {LAYERS.map((l, i) => (
          <div key={l.title} className="layer-row-card">
            <div className="layer-row-header">
              <span className="layer-step-num">0{i + 1}</span>
              <strong className="layer-title">{l.title}</strong>
              <span className={`provenance-badge ${l.badgeClass}`}>{l.badge}</span>
            </div>

            <div className="layer-row-body">
              <div className="layer-items-grid">
                {l.items.map((item) => (
                  <span key={item} className="layer-pill">{item}</span>
                ))}
              </div>
              <p className="layer-desc">{l.description}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionBase>
  );
}

