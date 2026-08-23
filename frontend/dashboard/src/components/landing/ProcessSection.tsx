import { useLanguage } from "../../hooks/useLanguage";
import { SectionBase } from "./SectionBase";
import "./ProcessSection.css";

export function ProcessSection() {
  const { t } = useLanguage();

  return (
    <SectionBase id="how-it-works" number="03" label={t.process_label.toUpperCase()}>
      <div className="process-heading">
        <h2 className="editorial-h2">
          {t.process_h2_1}<br />
          <span className="problem-h2-highlight">{t.process_h2_2}</span>
        </h2>
        <p className="body-lg process-subtitle">
          Every stage takes structured inputs, executes transparent processing, produces audit-logged outputs, and serves a clear governance purpose.
        </p>
      </div>

      <div className="process-grid">
        {t.process_stages.map((s) => (
          <div key={s.num} className={`process-card ${s.hitl ? "hitl-border" : ""}`}>
            <div className="process-card-header">
              <span className="section-number">{s.num}</span>
              <h3 className="process-card-title">{s.title}</h3>
              {s.hitl && <span className="hitl-badge">{t.process_checkpoint}</span>}
            </div>

            <div className="process-card-body">
              <div className="io-row">
                <span className="io-tag process">DESCRIPTION</span>
                <p className="io-text">{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionBase>
  );
}
