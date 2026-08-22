import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { SectionBase } from "./SectionBase";
import "./TransformationSection.css";

export function TransformationSection() {
  const { t } = useLanguage();
  const [activeStage, setActiveStage] = useState<number>(1);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

  return (
    <SectionBase id="intelligence" number="02" label={t.trans_label.toUpperCase()}>
      <div className="transform-layout">
        {/* Title */}
        <div className="transform-heading">
          <h2 className="editorial-h2">
            {t.trans_h2_1}<br />
            <span className="problem-h2-highlight">{t.trans_h2_2}</span>
          </h2>
          <p className="body-lg transform-subtitle">
            SPIN converts raw citizen voices into structured geospatial intelligence in five automated processing stages.
          </p>
        </div>

        {/* Stage Selector Pills */}
        <div className="transform-stepper">
          {[
            { id: 1, label: `01. ${t.trans_stage_1_label}` },
            { id: 2, label: "02. BHASHINI TRANSLATION" },
            { id: 3, label: `03. ${t.trans_stage_2_label}` },
            { id: 4, label: `04. ${t.trans_stage_3_label}` },
            { id: 5, label: `05. ${t.trans_stage_4_label}` },
          ].map((s) => (
            <button
              key={s.id}
              className={`stepper-pill ${activeStage === s.id ? "active" : ""}`}
              onClick={() => setActiveStage(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Stage Content Card */}
        <div className="transform-stage-card">
          {activeStage === 1 && (
            <div className="stage-content-grid">
              <div className="stage-info">
                <span className="label-eyebrow tag-blue">STAGE 01 / {t.trans_stage_1_label}</span>
                <blockquote className="citizen-voice-quote">
                  {t.trans_quote}
                </blockquote>
                <div className="meta-row">
                  {t.trans_stage_1_tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="tech-explanation-box">
                <span className="label-eyebrow">TECHNICAL TERM: Multilingual Unstructured Intake</span>
                <p>Citizens speak or write naturally in their local dialect. The system captures metadata, audio, and coarse location automatically without forcing rigid forms.</p>
              </div>
            </div>
          )}

          {activeStage === 2 && (
            <div className="stage-content-grid">
              <div className="stage-info">
                <span className="label-eyebrow tag-orange">STAGE 02 / BHASHINI MULTILINGUAL LAYER</span>
                <div className="translation-box">
                  <div className="trans-pair">
                    <span className="lang-label">Original Hindi:</span>
                    <span>"हमारे एरिया में पिछले 3 हफ्तों से पानी नहीं आ रहा।"</span>
                  </div>
                  <div className="trans-pair english">
                    <span className="lang-label">English AI Translation:</span>
                    <strong>"Water supply has been disrupted in our area for the last 3 weeks."</strong>
                  </div>
                </div>
              </div>
              <div className="tech-explanation-box">
                <span className="label-eyebrow">TECHNICAL TERM: Bhashini Speech-to-Text & Translation</span>
                <p>Translates 22+ official Indian languages into standardized text so downstream AI models can accurately assess intent and severity regardless of language barriers.</p>
              </div>
            </div>
          )}

          {activeStage === 3 && (
            <div className="stage-content-grid">
              <div className="stage-info">
                <span className="label-eyebrow tag-navy">STAGE 03 / {t.trans_stage_2_label}</span>
                <table className="data-table">
                  <tbody>
                    {t.trans_table_rows.map((row, i) => (
                      <tr key={i}>
                        <td>{row[0]}</td>
                        <td>{i === 1 ? <span className="num-orange font-bold">{row[1]}</span> : row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="tech-explanation-box">
                <span className="label-eyebrow">TECHNICAL TERM: Semantic Parsing</span>
                <p>SPIN converts unstructured complaints into structured information such as infrastructure domain, issue severity, duration, and required department.</p>
              </div>
            </div>
          )}

          {activeStage === 4 && (
            <div className="stage-content-grid">
              <div className="stage-info">
                <span className="label-eyebrow tag-geo">STAGE 04 / {t.trans_stage_3_label}</span>
                <div className="spatial-metrics">
                  <div className="metric-box">
                    <span className="num-large num-orange">37</span>
                    <span className="label-eyebrow">{t.trans_complaints}</span>
                  </div>
                  <div className="metric-box">
                    <span className="num-large">12 km²</span>
                    <span className="label-eyebrow">{t.trans_cluster}</span>
                  </div>
                  <div className="metric-box">
                    <span className="num-large">4.2x</span>
                    <span className="label-eyebrow">{t.trans_identified}</span>
                  </div>
                </div>
              </div>
              <div className="tech-explanation-box">
                <span className="label-eyebrow">TECHNICAL TERM: Geospatial Correlation</span>
                <p>SPIN checks whether multiple complaints are concentrated in the same geographic area to verify systemic infrastructure failure rather than isolated domestic issues.</p>
              </div>
            </div>
          )}

          {activeStage === 5 && (
            <div className="stage-content-grid">
              <div className="stage-info">
                <span className="label-eyebrow tag-red">STAGE 05 / {t.trans_stage_4_label}</span>
                <div className="redzone-banner">
                  <strong className="redzone-title">🔴 {t.trans_red_zone}: {t.trans_spatial_tag}</strong>
                  <p>{t.trans_pending}</p>
                  <div className="policy-rec-strip">
                    <span>{t.trans_recommended}: {t.trans_action}</span>
                  </div>
                </div>
              </div>
              <div className="tech-explanation-box">
                <span className="label-eyebrow">TECHNICAL TERM: Red Zone</span>
                <p>An area where citizen demand is unusually high relative to infrastructure response, requiring immediate policy intervention.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Trigger for Details Modal */}
        <div className="transform-actions-bar">
          <button className="btn-outline-orange" onClick={() => setShowDetailsModal(true)}>
            [ View Processing Details & System Specifications ]
          </button>
        </div>

        {/* Processing Details Modal */}
        {showDetailsModal && (
          <div className="transform-modal-backdrop" onClick={() => setShowDetailsModal(false)}>
            <div className="transform-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>SPIN System Trace & Processing Specifications</h3>
                <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="spec-section">
                  <strong>1. Bhashini Integration:</strong>
                  <p>Speech-to-text uses ASR (Automated Speech Recognition) trained on Indian regional dialects. Translation maps output to standard English JSON for LLM entity extraction.</p>
                </div>
                <div className="spec-section">
                  <strong>2. Gemini Semantic Agent:</strong>
                  <p>Prompt instructions enforce zero hallucination rules. Grievances are categorized strictly under Water, Road, Power, Rail, or Telecom with normalized severity floating values between 0.0 and 10.0.</p>
                </div>
                <div className="spec-section">
                  <strong>3. Spatial Join Algorithm:</strong>
                  <p>Density thresholds trigger a Red Zone when grievance density exceeds 3.0 grievances per km² over a 7-day rolling window.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowDetailsModal(false)}>Close Details</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionBase>
  );
}
