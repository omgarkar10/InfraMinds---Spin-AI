import { SectionBase } from "./SectionBase";
import "./ProcessSection.css";

const STAGES = [
  {
    num: "01",
    title: "Citizen Input",
    desc: "Text, voice, images in any local language via WhatsApp, Telegram, or web.",
    hitl: false,
  },
  {
    num: "02",
    title: "Language Processing",
    desc: "Bhashini detects language, transcribes speech, and translates to English for AI analysis. 22 Indian languages supported.",
    hitl: false,
  },
  {
    num: "03",
    title: "Location Verification",
    desc: "Human-in-the-loop gate confirms geographic context. If GPS is absent, the citizen is asked to provide a landmark.",
    hitl: true,
  },
  {
    num: "04",
    title: "Semantic Understanding",
    desc: "Gemini agent extracts domain, classifies intent, and scores severity.",
    hitl: false,
  },
  {
    num: "05",
    title: "Geospatial Correlation",
    desc: "Complaint is matched to infrastructure layers, demographics, and PM Gati Shakti planning data.",
    hitl: false,
  },
  {
    num: "06",
    title: "Policy Action",
    desc: "Red Zone identification, executive summary, and budget recommendation are surfaced for policymaker review.",
    hitl: false,
  },
];

export function ProcessSection() {
  return (
    <SectionBase id="architecture" number="03" label="The System">
      <div className="process-heading reveal">
        <h2 className="editorial-h2">Six stages.<br />One coherent pipeline.</h2>
      </div>

      <div className="process-stages">
        {STAGES.map((s, i) => (
          <div key={s.num} className="process-stage reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
            <div className="process-stage-num">
              <span className="section-number">{s.num}</span>
            </div>
            <div className="process-stage-content">
              <div className="process-stage-title-row">
                <h3 className="process-stage-title">{s.title}</h3>
                {s.hitl && <span className="hitl-badge">HUMAN CHECKPOINT</span>}
              </div>
              <p className="body-md process-stage-desc">{s.desc}</p>
            </div>
            {i < STAGES.length - 1 && (
              <div className="process-connector" aria-hidden="true">
                <div className="process-connector-line" />
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionBase>
  );
}
