import { SectionBase } from "./SectionBase";
import "./ImpactSection.css";

interface ImpactLevel {
  level: string;
  badge: string;
  before: string;
  after: string;
}

const IMPACT_LEVELS: ImpactLevel[] = [
  {
    level: "Citizen Level",
    badge: "Reporting Ease",
    before: "Must navigate complex forms in English or official legalese.",
    after: "Speaks or texts naturally in local dialect; gets automated progress updates.",
  },
  {
    level: "Administrative Level",
    badge: "Data Structuring",
    before: "Scattered spreadsheets and unclassified complaints in siloed databases.",
    after: "Automatically parsed intent, severity score, and assigned department.",
  },
  {
    level: "Spatial Level",
    badge: "Pattern Detection",
    before: "Isolated complaints resolved individually without seeing surrounding area.",
    after: "Red Zone clusters automatically highlighted over GIS infrastructure networks.",
  },
  {
    level: "Policy Level",
    badge: "Resource Prioritization",
    before: "Budget allocations driven by arbitrary requests or squeaky-wheel noise.",
    after: "Evidence-backed budget reallocation recommendations based on verified demand.",
  },
  {
    level: "National Level",
    badge: "Infrastructure Alignment",
    before: "Disconnect between DPI investment and actual citizen service delivery.",
    after: "Symbiotic alignment between citizen signals and public infrastructure planning.",
  },
];

export function ImpactSection() {
  return (
    <SectionBase id="impact" number="10" label="WHAT CHANGES">
      <div className="impact-heading">
        <h2 className="editorial-h2">
          When citizen demand becomes visible,<br />
          <span className="problem-h2-highlight">public decisions become precise.</span>
        </h2>
        <p className="body-lg impact-subtitle">
          Measurable system outcomes across five operational governance tiers.
        </p>
        <span className="demo-badge">[ DEMONSTRATION DATASET ]</span>
      </div>

      <div className="impact-levels-grid">
        {IMPACT_LEVELS.map((item) => (
          <div key={item.level} className="impact-card">
            <div className="impact-card-header">
              <span className="label-eyebrow">{item.level}</span>
              <span className="impact-pill">{item.badge}</span>
            </div>

            <div className="impact-comparison-box">
              <div className="comp-row before">
                <span className="comp-tag">TRADITIONAL:</span>
                <p>{item.before}</p>
              </div>
              <div className="comp-row after">
                <span className="comp-tag after">WITH SPIN:</span>
                <p>{item.after}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionBase>
  );
}

