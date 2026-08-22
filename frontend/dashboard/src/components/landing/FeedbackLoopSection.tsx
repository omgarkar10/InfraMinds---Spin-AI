import { SectionBase } from "./SectionBase";
import "./FeedbackLoopSection.css";

interface LoopStep {
  num: string;
  actor: string;
  title: string;
  description: string;
  badgeClass: string;
}

const LOOP_STEPS: LoopStep[] = [
  {
    num: "01",
    actor: "CITIZEN",
    title: "Reports Grievance in Local Dialect",
    description: "Citizen submits a voice note or WhatsApp message describing local water scarcity.",
    badgeClass: "badge-blue",
  },
  {
    num: "02",
    actor: "SPIN AI",
    title: "Parses & Correlates Signals",
    description: "Bhashini transcribes speech, Gemini extracts entities, and spatial engine maps cluster.",
    badgeClass: "badge-orange",
  },
  {
    num: "03",
    actor: "SPIN SYSTEM",
    title: "Identifies Red Zone Pattern",
    description: "System identifies 37 overlapping grievances on main pipeline Segment W-402.",
    badgeClass: "badge-red",
  },
  {
    num: "04",
    actor: "POLICYMAKER",
    title: "Reviews Dossier & Approves Action",
    description: "District official inspects evidence brief and approves ₹12 Cr budget reallocation.",
    badgeClass: "badge-navy",
  },
  {
    num: "05",
    actor: "PUBLIC WORKS",
    title: "Executes Infrastructure Project",
    description: "Contractor assigned to repair main line and restore municipal water supply.",
    badgeClass: "badge-amber",
  },
  {
    num: "06",
    actor: "CITIZEN",
    title: "Receives Bhashini Status Update",
    description: "Citizen automatically receives notification in Hindi: 'Your water issue work order approved.'",
    badgeClass: "badge-green",
  },
];

export function FeedbackLoopSection() {
  return (
    <SectionBase id="feedback-loop" number="07" label="THE COMPLETE FEEDBACK LOOP">
      <div className="loop-heading">
        <h2 className="editorial-h2">
          From citizen signal to policy action<br />
          <span className="problem-h2-highlight">— and back to the citizen.</span>
        </h2>
        <p className="body-lg loop-subtitle">
          SPIN is not merely a grievance chatbot. It is a complete, closed-loop infrastructure feedback engine.
        </p>
      </div>

      <div className="loop-flow-grid">
        {LOOP_STEPS.map((s, i) => (
          <div key={s.num} className="loop-step-card">
            <div className="loop-card-top">
              <span className="step-num">{s.num}</span>
              <span className={`actor-badge ${s.badgeClass}`}>{s.actor}</span>
            </div>
            <strong className="loop-step-title">{s.title}</strong>
            <p className="loop-step-desc">{s.description}</p>
            {i < LOOP_STEPS.length - 1 && <span className="loop-connect-arrow">→</span>}
          </div>
        ))}
      </div>
    </SectionBase>
  );
}
