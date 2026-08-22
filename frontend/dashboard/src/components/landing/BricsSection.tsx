import { SectionBase } from "./SectionBase";
import "./BricsSection.css";

const COUNTRIES = [
  { name: "India", status: "active", note: "Active prototype" },
  { name: "Brazil", status: "proposed", note: "Adaptable" },
  { name: "Russia", status: "proposed", note: "Adaptable" },
  { name: "China", status: "proposed", note: "Adaptable" },
  { name: "South Africa", status: "proposed", note: "Adaptable" },
];

const ARCH_LAYERS = [
  "CORE SPIN ARCHITECTURE",
  "LOCAL LANGUAGE LAYER",
  "LOCAL GOVERNMENT DATA",
  "LOCAL POLICY RULES",
];

export function BricsSection() {
  return (
    <SectionBase id="impact" number="08" label="Global Scale">
      <div className="brics-layout">
        <div className="brics-left">
          <div className="reveal">
            <h2 className="editorial-h2">Built in India.</h2>
            <h2 className="editorial-h2 brics-h2-dim">Designed to travel.</h2>
          </div>
          <p className="body-md brics-body reveal animate-reveal-delay-1">
            The architecture is designed to adapt to different national datasets,
            languages and governance systems while preserving sovereign control
            over local data.
          </p>

          {/* Countries */}
          <div className="brics-countries reveal animate-reveal-delay-2">
            {COUNTRIES.map((c) => (
              <div key={c.name} className={`brics-country ${c.status === "active" ? "brics-country-active" : ""}`}>
                <span className="brics-country-name">{c.name}</span>
                <span className={`tag ${c.status === "active" ? "tag-orange" : ""}`}>{c.note}</span>
              </div>
            ))}
          </div>
          <p className="disclaimer reveal animate-reveal-delay-3" style={{ marginTop: "var(--sp-md)" }}>
            PROPOSED ARCHITECTURE / NOT CURRENTLY DEPLOYED
          </p>
        </div>

        {/* Architecture stack */}
        <div className="brics-right reveal animate-reveal-delay-2">
          <div className="brics-arch">
            {ARCH_LAYERS.map((layer, i) => (
              <div key={layer}>
                <div className="brics-arch-layer">
                  <p className="label-eyebrow">{layer}</p>
                </div>
                {i < ARCH_LAYERS.length - 1 && (
                  <div className="brics-arch-connector">×</div>
                )}
              </div>
            ))}
            <div className="brics-arch-result">
              <span className="brics-arch-equals">=</span>
              <p className="label-orange">COUNTRY-SPECIFIC DEPLOYMENT</p>
            </div>
          </div>

          <div className="brics-arch-tags">
            {["ADAPTABLE", "MODULAR", "OPEN", "SOVEREIGN"].map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </SectionBase>
  );
}
