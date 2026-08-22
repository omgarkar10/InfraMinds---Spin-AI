import { SectionBase } from "./SectionBase";
import "./ImpactSection.css";

const METRICS = [
  { value: "4,200", label: "Signals Verified", sub: "Demo dataset" },
  { value: "14",    label: "High-Priority Zones", sub: "Demo dataset" },
  { value: "7 days", label: "Analysis Window", sub: "Rolling period" },
  { value: "22",    label: "Indian Languages", sub: "Via Bhashini" },
  { value: "6",     label: "AI Workflow Stages", sub: "Agent pipeline" },
];

export function ImpactSection() {
  return (
    <SectionBase id="impact" number="09" label="System Impact">
      <div className="impact-heading reveal">
        <h2 className="editorial-h2">
          When demand becomes visible,<br />decisions can become precise.
        </h2>
      </div>

      <div className="demo-badge reveal animate-reveal-delay-1">DEMO DATASET</div>

      <div className="impact-metrics reveal animate-reveal-delay-1">
        {METRICS.map((m) => (
          <div key={m.label} className="impact-metric">
            <span className="num-large num-orange">{m.value}</span>
            <span className="impact-metric-label">{m.label}</span>
            <span className="impact-metric-sub">{m.sub}</span>
          </div>
        ))}
      </div>
    </SectionBase>
  );
}
