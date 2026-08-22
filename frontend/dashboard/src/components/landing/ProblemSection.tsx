import { SectionBase } from "./SectionBase";
import "./ProblemSection.css";

const CITIZEN = ["Voice", "Text", "Images", "Local languages", "GPS location"];
const GOVERNMENT = ["CPGRAMS", "Infrastructure records", "PM Gati Shakti", "Demographics", "Planning data"];
const OUTCOMES = ["FRAGMENTED SIGNALS", "SILOED SYSTEMS", "REACTIVE DECISIONS"];

export function ProblemSection() {
  return (
    <SectionBase id="how-it-works" number="01" label="The Problem">
      <div className="problem-layout">
        {/* Heading */}
        <div className="problem-heading reveal">
          <h2 className="editorial-h2">
            The problem isn't<br />a lack of data.
          </h2>
          <h2 className="editorial-h2 problem-h2-dim">
            It's disconnected data.
          </h2>
        </div>

        {/* Disconnected systems diagram */}
        <div className="problem-diagram reveal animate-reveal-delay-1">
          <div className="problem-col">
            <p className="label-eyebrow problem-col-label">Citizen Signals</p>
            <ul className="problem-list">
              {CITIZEN.map((item) => (
                <li key={item} className="problem-item">{item}</li>
              ))}
            </ul>
          </div>

          {/* Gap — lines stop short */}
          <div className="problem-gap" aria-hidden="true">
            <svg width="120" height="200" viewBox="0 0 120 200" fill="none" className="problem-gap-svg">
              {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
                <line key={i}
                  x1="0" y1={y * 200}
                  x2="52" y2={y * 200}
                  stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3"
                />
              ))}
              {[0.25, 0.5, 0.75].map((y, i) => (
                <line key={`r${i}`}
                  x1="68" y1={y * 200}
                  x2="120" y2={y * 200}
                  stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3"
                />
              ))}
              <text x="60" y="104" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="18">✕</text>
            </svg>
          </div>

          <div className="problem-col problem-col-right">
            <p className="label-eyebrow problem-col-label">Government Systems</p>
            <ul className="problem-list">
              {GOVERNMENT.map((item) => (
                <li key={item} className="problem-item">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Outcome row */}
      <div className="problem-outcomes reveal animate-reveal-delay-2">
        <div className="problem-outcomes-row">
          {OUTCOMES.map((o, i) => (
            <div key={o} className="problem-outcome-item">
              <span className="label-orange">{o}</span>
              {i < OUTCOMES.length - 1 && <span className="problem-outcome-slash">/</span>}
            </div>
          ))}
        </div>
        <p className="editorial-h3 problem-result reveal animate-reveal-delay-3">
          Misaligned infrastructure investment.
        </p>
      </div>
    </SectionBase>
  );
}
