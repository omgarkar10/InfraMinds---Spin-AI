import { useEffect, useRef, useState } from "react";
import { SectionBase } from "./SectionBase";
import "./TransformationSection.css";

const STAGES = [
  {
    id: "raw",
    stageNum: "01",
    stageLabel: "RAW SIGNAL",
    content: (
      <>
        <blockquote className="transform-quote">
          "Hamare area mein pichle 3 hafton se paani nahi aa raha."
        </blockquote>
        <p className="transform-tag-row">
          <span className="tag">HINDI</span>
          <span className="tag">UNSTRUCTURED</span>
          <span className="tag">VOICE INPUT</span>
        </p>
      </>
    ),
  },
  {
    id: "ai",
    stageNum: "02",
    stageLabel: "AI INTERPRETATION",
    content: (
      <table className="data-table transform-table">
        <tbody>
          {[
            ["DOMAIN", "WATER"],
            ["SEVERITY", "HIGH"],
            ["LOCATION", "Pune"],
            ["ISSUE", "Supply disruption — 3 weeks"],
            ["LANGUAGE", "Hindi → English"],
          ].map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td style={k === "SEVERITY" ? { color: "var(--col-orange)" } : {}}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    id: "spatial",
    stageNum: "03",
    stageLabel: "SPATIAL INTELLIGENCE",
    content: (
      <div className="transform-spatial">
        <div className="transform-spatial-row">
          <div className="transform-spatial-node">
            <span className="num-large">37</span>
            <span className="label-eyebrow">Complaints</span>
          </div>
          <div className="transform-spatial-arrow">
            <svg width="48" height="2" viewBox="0 0 48 2" fill="none">
              <line x1="0" y1="1" x2="40" y2="1" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
              <path d="M40 -2L48 1L40 4" fill="rgba(255,255,255,0.25)"/>
            </svg>
          </div>
          <div className="transform-spatial-node">
            <span className="num-large">1</span>
            <span className="label-eyebrow">Cluster</span>
          </div>
          <div className="transform-spatial-arrow">
            <svg width="48" height="2" viewBox="0 0 48 2" fill="none">
              <line x1="0" y1="1" x2="40" y2="1" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
              <path d="M40 -2L48 1L40 4" fill="rgba(255,255,255,0.25)"/>
            </svg>
          </div>
          <div className="transform-spatial-node">
            <span className="num-large transform-red-zone-label">RED ZONE</span>
            <span className="label-eyebrow">Identified</span>
          </div>
        </div>
        <p className="tag tag-red" style={{ marginTop: "var(--sp-lg)" }}>PUNE EAST / WATER / HIGH DENSITY</p>
      </div>
    ),
  },
  {
    id: "policy",
    stageNum: "04",
    stageLabel: "POLICY ACTION",
    content: (
      <div className="transform-policy">
        <p className="label-eyebrow" style={{ marginBottom: "var(--sp-sm)" }}>Recommended</p>
        <p className="editorial-h3" style={{ marginBottom: "var(--sp-lg)" }}>
          Increase water infrastructure allocation — Pune East
        </p>
        <p className="tag tag-orange" style={{ marginBottom: "var(--sp-lg)" }}>
          AWAITING POLICYMAKER DECISION
        </p>
        <p className="disclaimer">AI RECOMMENDS. HUMANS REMAIN ACCOUNTABLE.</p>
      </div>
    ),
  },
];

export function TransformationSection() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 2200);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const replay = () => {
    setActive(0);
    startTimer();
  };

  return (
    <SectionBase id="intelligence" number="02" label="See the Transformation">
      <div className="transform-intro reveal">
        <h2 className="editorial-h2">
          What if every complaint<br />became a planning signal?
        </h2>
      </div>

      {/* Stage labels row */}
      <div className="transform-stage-labels reveal animate-reveal-delay-1">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            className={`transform-stage-btn ${i <= active ? "active" : ""} ${i === active ? "current" : ""}`}
            onClick={() => { setActive(i); if (timerRef.current) clearInterval(timerRef.current); }}
          >
            <span className="transform-stage-num">{s.stageNum}</span>
            <span className="transform-stage-lbl">{s.stageLabel}</span>
            <span className="transform-stage-line" />
          </button>
        ))}
      </div>

      {/* Stage content */}
      <div className="transform-content reveal animate-reveal-delay-2">
        {STAGES.map((s, i) => (
          <div key={s.id} className={`transform-stage-content ${i === active ? "visible" : ""}`}>
            {s.content}
          </div>
        ))}
      </div>

      {/* Replay */}
      {active === STAGES.length - 1 && (
        <div className="transform-replay">
          <button className="transform-replay-btn" onClick={replay}>
            [ REPLAY ]
          </button>
        </div>
      )}
    </SectionBase>
  );
}
