import { SectionBase } from "./SectionBase";
import "./EcosystemSection.css";

const LAYERS = [
  {
    label: "CITIZEN SIGNALS",
    items: ["Voice", "Text", "Images", "Location"],
  },
  {
    label: "LANGUAGE & AI",
    items: ["Bhashini — language detection", "Speech recognition (ASR)", "Translation", "Semantic parsing"],
  },
  {
    label: "GOVERNMENT DATA",
    items: ["CPGRAMS", "PM Gati Shakti", "Demographics", "Infrastructure layers"],
  },
  {
    label: "POLICY INTELLIGENCE",
    items: ["Red Zones", "Infrastructure gaps", "Priorities", "Recommendations"],
  },
];

const BHASHINI_FLOW = [
  "Hindi voice",
  "Bhashini",
  "English grievance",
  "AI analysis",
  "Policy insight",
];

export function EcosystemSection() {
  return (
    <SectionBase id="intelligence" number="04" label="Data Ecosystem">
      <div className="ecosystem-heading reveal">
        <h2 className="editorial-h2">One signal is useful.</h2>
        <h2 className="editorial-h2 ecosystem-h2-dim">A connected signal is powerful.</h2>
      </div>

      {/* Layered architecture — vertical stack with arrows */}
      <div className="ecosystem-layers reveal animate-reveal-delay-1">
        {LAYERS.map((layer, i) => (
          <div key={layer.label}>
            <div className="ecosystem-layer">
              <div className="ecosystem-layer-label">
                <p className="label-orange">{layer.label}</p>
              </div>
              <div className="ecosystem-layer-items">
                {layer.items.map((item) => (
                  <span key={item} className="ecosystem-item">{item}</span>
                ))}
              </div>
            </div>
            {i < LAYERS.length - 1 && (
              <div className="ecosystem-arrow" aria-hidden="true">
                <div className="ecosystem-arrow-line" />
                <span className="ecosystem-arrow-head">↓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bhashini callout — inline, not a card */}
      <div className="ecosystem-bhashini reveal animate-reveal-delay-2">
        <div className="divider" style={{ marginBottom: "var(--sp-xl)" }} />
        <h3 className="editorial-h3 ecosystem-bhashini-heading">
          Language should never be a barrier to governance.
        </h3>
        <p className="body-md ecosystem-bhashini-body">
          SPIN accepts citizen input in any of 22 Indian languages. Bhashini provides
          automatic detection, speech transcription and translation into English before
          AI analysis. Every voice matters, regardless of language.
        </p>
        {/* Bhashini flow */}
        <div className="ecosystem-bhashini-flow">
          {BHASHINI_FLOW.map((node, i, arr) => (
            <div key={node} style={{ display: "flex", alignItems: "center" }}>
              <span className="ecosystem-flow-node">{node}</span>
              {i < arr.length - 1 && (
                <span className="ecosystem-flow-arrow" aria-hidden="true">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionBase>
  );
}
