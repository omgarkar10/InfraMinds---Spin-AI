import { SectionBase } from "./SectionBase";
import "./ProcessSection.css";

interface Stage {
  num: string;
  title: string;
  hitl?: boolean;
  input: string;
  process: string;
  output: string;
  why: string;
}

const SIX_STAGES: Stage[] = [
  {
    num: "01",
    title: "Citizen Input Intake",
    hitl: false,
    input: "Text, natural voice audio, photo evidence, or cell tower location via WhatsApp / web.",
    process: "Normalizes incoming payload, assigns unique tracking ID, extracts raw audio/text metadata.",
    output: "Raw Unverified Grievance Packet",
    why: "Ensures citizens can express complaints effortlessly without needing to navigate complex municipal forms.",
  },
  {
    num: "02",
    title: "Language & Signal Processing",
    hitl: false,
    input: "Unstructured grievance in regional Indian dialects (Hindi, Marathi, Tamil, Bengali, etc.).",
    process: "Bhashini ASR transcribes voice to text; machine translation converts to standard English for AI analysis.",
    output: "Standardized Multilingual Text Payload",
    why: "Language diversity must never prevent a citizen's grievance from reaching infrastructure planners.",
  },
  {
    num: "03",
    title: "Location Verification (HITL Gate)",
    hitl: true,
    input: "Complaint payload with coarse location metadata or missing coordinates.",
    process: "Human operator confirms landmark / GPS coordinates before allowing automated workflow to proceed.",
    output: "Validated Spatial Signal with GIS Point",
    why: "Prevents garbage-in garbage-out GIS errors by requiring human/citizen validation whenever location confidence is low.",
  },
  {
    num: "04",
    title: "Semantic Understanding",
    hitl: false,
    input: "Validated English text of the citizen grievance.",
    process: "Gemini agent extracts entity (water pipe, pothole, transformer), assesses severity (0–10), and calculates urgency.",
    output: "Structured Grievance JSON (Domain, Severity, Urgency)",
    why: "Converts subjective human text into quantitative parameters that algorithms can query and analyze at scale.",
  },
  {
    num: "05",
    title: "Geospatial Correlation",
    hitl: false,
    input: "Structured grievance JSON + GIS coordinate point.",
    process: "Correlates complaint with PM Gati Shakti infrastructure maps, demographic layers, and spatial density thresholds.",
    output: "Clustered Demand Map & Red Zone Alert Flag",
    why: "Identifies systemic failure zones where hundreds of complaints overlap on the exact same infrastructure asset.",
  },
  {
    num: "06",
    title: "Policy Intelligence Output",
    hitl: false,
    input: "Verified Red Zone alert + infrastructure gap evidence.",
    process: "Generates executive summary, priority ranking, and evidence-backed budget reallocation recommendations.",
    output: "Policymaker Executive Brief & Budget Recommendation",
    why: "Empowers department heads to allocate public funds with objective data evidence rather than ad-hoc estimates.",
  },
];

export function ProcessSection() {
  return (
    <SectionBase id="how-it-works" number="03" label="HOW SPIN WORKS">
      <div className="process-heading">
        <h2 className="editorial-h2">
          Six stages.<br />
          <span className="problem-h2-highlight">One coherent, transparent pipeline.</span>
        </h2>
        <p className="body-lg process-subtitle">
          Every stage takes structured inputs, executes transparent processing, produces audit-logged outputs, and serves a clear governance purpose.
        </p>
      </div>

      <div className="process-grid">
        {SIX_STAGES.map((s) => (
          <div key={s.num} className={`process-card ${s.hitl ? "hitl-border" : ""}`}>
            <div className="process-card-header">
              <span className="section-number">{s.num}</span>
              <h3 className="process-card-title">{s.title}</h3>
              {s.hitl && <span className="hitl-badge">HITL GATE</span>}
            </div>

            <div className="process-card-body">
              <div className="io-row">
                <span className="io-tag input">INPUT</span>
                <p className="io-text">{s.input}</p>
              </div>

              <div className="io-row">
                <span className="io-tag process">PROCESS</span>
                <p className="io-text">{s.process}</p>
              </div>

              <div className="io-row">
                <span className="io-tag output">OUTPUT</span>
                <p className="io-text bold">{s.output}</p>
              </div>
            </div>

            <div className="process-card-why">
              <span className="why-label">WHY THIS MATTERS:</span>
              <p className="why-text">"{s.why}"</p>
            </div>
          </div>
        ))}
      </div>
    </SectionBase>
  );
}

