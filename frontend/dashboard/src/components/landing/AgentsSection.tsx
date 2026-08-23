import { useLanguage } from "../../hooks/useLanguage";
import { SectionBase } from "./SectionBase";
import "./AgentsSection.css";

export function AgentsSection() {
  const { t } = useLanguage();

  return (
    <SectionBase id="architecture" number="05" label={t.agents_label.toUpperCase()}>
      <div className="agents-heading">
        <h2 className="editorial-h2">
          {t.agents_h2_1}<br />
          <span className="problem-h2-highlight">{t.agents_h2_2}</span>
        </h2>
      </div>

      {/* Agent Specifications Grid */}
      <div className="agents-spec-grid">
        {t.agents_list.map((agent) => (
          <div key={agent.num} className={`agent-card ${agent.hitl ? "hitl-card" : ""}`}>
            <div className="agent-card-header">
              <span className="agent-num">{agent.num}</span>
              <h3 className="agent-name">{agent.name}</h3>
              {agent.hitl && <span className="hitl-badge">HUMAN GATEWAY</span>}
            </div>

            <p className="agent-role font-medium">{agent.role}</p>

            <div className="agent-io-specs">
              {agent.input && (
                <div className="io-spec-row">
                  <span className="io-spec-label">INPUT:</span>
                  <span className="io-spec-val">{agent.input}</span>
                </div>
              )}
              {agent.process && (
                <div className="io-spec-row">
                  <span className="io-spec-label">PROCESS:</span>
                  <span className="io-spec-val">{agent.process}</span>
                </div>
              )}
              {agent.output && (
                <div className="io-spec-row">
                  <span className="io-spec-label">OUTPUT:</span>
                  <span className="io-spec-val highlight">{agent.output}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DEDICATED HUMAN-IN-THE-LOOP (HITL) FEATURE BLOCK */}
      <div className="hitl-feature-block">
        <div className="hitl-block-header">
          <span className="label-eyebrow tag-orange">RESPONSIBLE AI GOVERNANCE</span>
          <h3 className="editorial-h3">AI DOES NOT MAKE EVERY DECISION.</h3>
          <p className="body-md">
            If location, severity or evidence is insufficient, SPIN pauses automated processing and requests human/citizen confirmation.
          </p>
        </div>

        {/* HITL Flow Visual */}
        <div className="hitl-flow-visual">
          <div className="hitl-flow-step">
            <span className="step-tag">AI ENGINE</span>
            <strong>Intake Processing</strong>
          </div>

          <span className="hitl-flow-arrow">→</span>

          <div className="hitl-flow-step warning">
            <span className="step-tag warning">UNCERTAINTY DETECTED</span>
            <strong>Location Confidence &lt;80%</strong>
          </div>

          <span className="hitl-flow-arrow">→</span>

          <div className="hitl-flow-step human">
            <span className="step-tag human">HUMAN REVIEW</span>
            <strong>Operator Confirm / SMS Landmark</strong>
          </div>

          <span className="hitl-flow-arrow">→</span>

          <div className="hitl-flow-step success">
            <span className="step-tag success">CONFIRMED SIGNAL</span>
            <strong>Pipeline Resumes</strong>
          </div>
        </div>

        <div className="hitl-footer-note">
          <span className="disclaimer">{t.agents_disclaimer}</span>
        </div>
      </div>
    </SectionBase>
  );
}
