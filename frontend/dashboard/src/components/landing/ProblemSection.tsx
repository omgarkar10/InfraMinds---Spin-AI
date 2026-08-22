import { SectionBase } from "./SectionBase";
import "./ProblemSection.css";

export function ProblemSection() {
  return (
    <SectionBase id="how-it-works" number="01" label="THE PROBLEM">
      <div className="problem-layout">
        {/* Title */}
        <div className="problem-heading">
          <h2 className="editorial-h2">
            The problem isn't a lack of data.<br />
            <span className="problem-h2-highlight">It's disconnected data.</span>
          </h2>
          <p className="body-lg problem-subtitle">
            A grievance may be successfully registered and resolved individually, yet hundreds of similar grievances may remain invisible as a larger infrastructure pattern. This is the gap SPIN addresses.
          </p>
        </div>

        {/* Editorial Diagram Flow */}
        <div className="problem-editorial-diagram">
          {/* Left: Citizen Layer */}
          <div className="diagram-card citizen-layer">
            <span className="label-eyebrow">01 / CITIZEN INPUT SIGNALS</span>
            <strong className="card-title">Scattered Citizen Voices</strong>
            <ul className="diagram-list">
              <li>Voice messages & local dialects</li>
              <li>WhatsApp & web text complaints</li>
              <li>Photo evidence & cell tower location</li>
              <li>CPGRAMS individual registrations</li>
            </ul>
          </div>

          <div className="diagram-flow-arrow">
            <span>↓</span>
            <span className="arrow-label">FRAGMENTATION GAP</span>
          </div>

          {/* Middle: Siloed Systems */}
          <div className="diagram-card fragmented-systems">
            <span className="label-eyebrow">02 / SILOED DEPARTMENTS</span>
            <strong className="card-title">Disconnected Infrastructure Systems</strong>
            <ul className="diagram-list">
              <li>CPGRAMS grievance database</li>
              <li>State & municipal complaint portals</li>
              <li>Public works department spreadsheets</li>
              <li>Isolated GIS maps & census grids</li>
            </ul>
          </div>

          <div className="diagram-flow-arrow break">
            <span className="break-icon">✕</span>
            <span className="arrow-label failure">RESPONSE GAP</span>
          </div>

          {/* Right: Policymaker Disconnect */}
          <div className="diagram-card decision-maker">
            <span className="label-eyebrow">03 / DECISION MAKER GAP</span>
            <strong className="card-title">Reactive Infrastructure Planning</strong>
            <div className="failure-callout">
              <span className="failure-eq">Citizen Demand ≠ Infrastructure Planning</span>
              <p>Individual complaints get closed, but systemic pipe breaks, road failures, and power deficits remain unaddressed.</p>
            </div>
          </div>
        </div>
      </div>
    </SectionBase>
  );
}

