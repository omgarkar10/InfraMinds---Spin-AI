import { SectionBase } from "./SectionBase";
import "./BricsSection.css";

export function BricsSection() {
  return (
    <SectionBase id="architecture" number="09" label="GLOBAL BRICS ARCHITECTURE">
      <div className="brics-layout">
        {/* Title */}
        <div className="brics-heading">
          <h2 className="editorial-h2">
            A digital public good<br />
            <span className="problem-h2-highlight">for the Global South.</span>
          </h2>
          <p className="body-lg brics-subtitle">
            SPIN's core architecture is fully modular. The AI and language layer can be localized for any country while the underlying data layer remains sovereign.
          </p>
          <span className="proposed-arch-badge">PROPOSED SCALABLE ARCHITECTURE</span>
        </div>

        {/* Global Architecture Diagram */}
        <div className="brics-diagram">
          {/* Left: Common Core */}
          <div className="arch-col common-core">
            <div className="arch-card-header">
              <span className="label-eyebrow tag-orange">SHARED CORE</span>
              <strong className="arch-card-title">SPIN Common Engine</strong>
            </div>
            <ul className="arch-feature-list">
              <li>Multi-agent orchestration DAG</li>
              <li>Geospatial density clustering engine</li>
              <li>Red Zone predictive analytics</li>
              <li>Human-in-the-loop governance audit</li>
            </ul>
          </div>

          <div className="arch-flow-symbol">→</div>

          {/* Right: Country Specific Adapters */}
          <div className="arch-col country-adapters">
            <div className="arch-card-header">
              <span className="label-eyebrow tag-blue">LOCAL ADAPTERS</span>
              <strong className="arch-card-title">Sovereign Country Layers</strong>
            </div>
            <div className="brics-grid">
              <div className="brics-card active">
                <span className="brics-flag">🇮🇳</span>
                <strong>India (Active Prototype)</strong>
                <span>Bhashini AI · CPGRAMS · PM Gati Shakti</span>
              </div>
              <div className="brics-card">
                <span className="brics-flag">🇧🇷</span>
                <strong>Brazil (Proposed)</strong>
                <span>Portuguese NLP · Fala.BR · GIS Overlay</span>
              </div>
              <div className="brics-card">
                <span className="brics-flag">🇷🇺</span>
                <strong>Russia (Proposed)</strong>
                <span>Russian ASR · Gosuslugi · Regional Maps</span>
              </div>
              <div className="brics-card">
                <span className="brics-flag">🇨🇳</span>
                <strong>China (Proposed)</strong>
                <span>Mandarin NLP · 12345 Network · Spatial Grid</span>
              </div>
              <div className="brics-card">
                <span className="brics-flag">🇿🇦</span>
                <strong>South Africa (Proposed)</strong>
                <span>Zulu/English ASR · GovChat · Municipal GIS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionBase>
  );
}

