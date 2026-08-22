import { SectionBase } from "./SectionBase";
import "./PredictiveSection.css";

const TRADITIONAL = [
  "Complaint received",
  "Forwarded to department",
  "Ticket opened",
  "Response (if any)",
  "Ticket closed",
];

const SPIN_STEPS = [
  "Complaint received",
  "+ Location data",
  "+ Infrastructure layers",
  "+ Demographics + AI",
  "↓  Pattern identified",
  "↓  Prediction generated",
  "↓  Policy priority surfaced",
];

export function PredictiveSection() {
  return (
    <SectionBase id="overview" number="07" label="Predictive Governance">
      <div className="predictive-heading reveal">
        <h2 className="editorial-h2">
          From grievance redressal<br />to predictive governance.
        </h2>
      </div>

      <div className="predictive-comparison reveal animate-reveal-delay-1">
        {/* Traditional */}
        <div className="predictive-col">
          <p className="label-eyebrow predictive-col-label">Traditional System</p>
          <ul className="predictive-list">
            {TRADITIONAL.map((item) => (
              <li key={item} className="predictive-item predictive-item-dim">{item}</li>
            ))}
          </ul>
          <p className="predictive-outcome predictive-outcome-dim">Reactive. Isolated. Incomplete.</p>
        </div>

        {/* Divider */}
        <div className="predictive-divider" aria-hidden="true">
          <div className="predictive-divider-line" />
        </div>

        {/* SPIN */}
        <div className="predictive-col">
          <p className="label-orange predictive-col-label">SPIN</p>
          <ul className="predictive-list">
            {SPIN_STEPS.map((item, i) => (
              <li
                key={item}
                className={`predictive-item ${i >= 4 ? "predictive-item-orange" : ""}`}
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="predictive-outcome">Evidence-based. Anticipatory. Precise.</p>
        </div>
      </div>
    </SectionBase>
  );
}
