import { useState } from "react";
import { SectionBase } from "./SectionBase";
import "./TransformationSection.css";

export function TransformationSection() {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

  return (
    <SectionBase id="intelligence" number="02" label="FROM VOICE TO DATA">
      <div className="transform-layout">
        {/* Title */}
        <div className="transform-heading">
          <h2 className="editorial-h2">
            What if every complaint<br />
            <span className="problem-h2-highlight">became an infrastructure planning signal?</span>
          </h2>
          <p className="body-lg transform-subtitle">
            SPIN converts raw citizen voices into structured geospatial intelligence in five automated processing stages.
          </p>
        </div>

        {/* Stage Selector Pills */}
        <div className="transform-stepper">
          {[
            { id: 1, label: "01. RAW CITIZEN VOICE" },
            { id: 2, label: "02. BHASHINI TRANSLATION" },
            { id: 3, label: "03. SEMANTIC PARSING" },
            { id: 4, label: "04. GEOSPATIAL CORRELATION" },
            { id: 5, label: "05. RED ZONE OUTPUT" },
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
                <span className="label-eyebrow tag-blue">STAGE 01 / INPUT SIGNALS</span>
                <blockquote className="citizen-voice-quote">
                  "Hamare area mein pichle 3 hafton se paani nahi aa raha."
                </blockquote>
                <div className="meta-row">
                  <span className="tag">Hindi (HI) Speech Waveform</span>
                  <span className="tag">Cell Tower Location: Pune East</span>
                  <span className="tag">WhatsApp Voice Note</span>
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
                <span className="label-eyebrow tag-navy">STAGE 03 / GEMINI SEMANTIC PARSER</span>
                <table className="data-table">
                  <tbody>
                    <tr><td>Domain</td><td>Water Supply / Municipal Grid</td></tr>
                    <tr><td>Issue Type</td><td>Supply Disruption / Main Line Failure</td></tr>
                    <tr><td>Severity Score</td><td><span className="num-orange font-bold">8.5 / 10 (Critical)</span></td></tr>
                    <tr><td>Duration</td><td>21 Days (3 Weeks)</td></tr>
                    <tr><td>Confidence</td><td>94.2% AI Model Certainty</td></tr>
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
                <span className="label-eyebrow tag-geo">STAGE 04 / GEOSPATIAL CORRELATION</span>
                <div className="spatial-metrics">
                  <div className="metric-box">
                    <span className="num-large num-orange">37</span>
                    <span className="label-eyebrow">Similar Grievances</span>
                  </div>
                  <div className="metric-box">
                    <span className="num-large">12 km²</span>
                    <span className="label-eyebrow">Geographic Radius</span>
                  </div>
                  <div className="metric-box">
                    <span className="num-large">4.2x</span>
                    <span className="label-eyebrow">Above Baseline Density</span>
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
                <span className="label-eyebrow tag-red">STAGE 05 / RED ZONE OUTPUT</span>
                <div className="redzone-banner">
                  <strong className="redzone-title">🔴 RED ZONE FLAG: Pune East Water Grid Deficit</strong>
                  <p>37 citizen complaints + PM Gati Shakti pipeline layer confirm major water main rupture on Segment W-402.</p>
                  <div className="policy-rec-strip">
                    <span>AI RECOMMENDATION: Prioritize ₹12 Cr pipeline replacement in Ward 14</span>
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
