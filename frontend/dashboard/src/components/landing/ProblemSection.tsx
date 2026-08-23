import { useLanguage } from "../../hooks/useLanguage";
import { SectionBase } from "./SectionBase";
import "./ProblemSection.css";

export function ProblemSection() {
  const { t } = useLanguage();
  return (
    <SectionBase id="how-it-works" number="01" label={t.problem_label.toUpperCase()}>
      <div className="problem-layout">
        {/* Title */}
        <div className="problem-heading">
          <h2 className="editorial-h2">
            {t.problem_h2_1}<br />
            <span className="problem-h2-highlight">{t.problem_h2_2}</span>
          </h2>
          <p className="body-lg problem-subtitle">
            {t.problem_result}
          </p>
        </div>

        {/* Editorial Diagram Flow */}
        <div className="problem-editorial-diagram">
          {/* Left: Citizen Layer */}
          <div className="diagram-card citizen-layer">
            <span className="label-eyebrow">01 / {t.problem_citizen_title.toUpperCase()}</span>
            <strong className="card-title">{t.problem_citizen_title}</strong>
            <ul className="diagram-list">
              {t.problem_citizen_items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="diagram-flow-arrow">
            <span>↓</span>
            <span className="arrow-label">{t.problem_outcomes[0]}</span>
          </div>

          {/* Middle: Siloed Systems */}
          <div className="diagram-card fragmented-systems">
            <span className="label-eyebrow">02 / {t.problem_gov_title.toUpperCase()}</span>
            <strong className="card-title">{t.problem_gov_title}</strong>
            <ul className="diagram-list">
              {t.problem_gov_items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="diagram-flow-arrow break">
            <span className="break-icon">✕</span>
            <span className="arrow-label failure">{t.problem_outcomes[2]}</span>
          </div>

          {/* Right: Policymaker Disconnect */}
          <div className="diagram-card decision-maker">
            <span className="label-eyebrow">03 / {t.problem_outcomes[2]}</span>
            <strong className="card-title">{t.problem_result}</strong>
            <div className="failure-callout">
              <span className="failure-eq">{t.problem_result}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionBase>
  );
}
