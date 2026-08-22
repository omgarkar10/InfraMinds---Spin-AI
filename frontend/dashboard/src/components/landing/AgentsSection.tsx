import { SectionBase } from "./SectionBase";
import "./AgentsSection.css";

const AGENTS = [
  {
    num: "01",
    name: "Root Agent",
    role: "Orchestrates the full pipeline workflow.",
    input: null,
    process: null,
    output: null,
    hitl: false,
  },
  {
    num: "02",
    name: "Chatbot Intake Agent",
    role: "Receives and normalizes citizen input.",
    input: "Citizen message — any format, any language",
    process: null,
    output: "Normalized intake payload",
    hitl: false,
  },
  {
    num: "03",
    name: "HITL Location Gate",
    role: "Human verifies that sufficient location data exists before the pipeline continues.",
    input: "Intake payload",
    process: "Human confirms location context",
    output: "Location-confirmed complaint — or citizen prompt for GPS",
    hitl: true,
  },
  {
    num: "04",
    name: "Semantic Parsing Agent",
    role: "Understands the complaint in depth.",
    input: '"The road outside our school has been broken for months."',
    process: "Entity extraction · Intent classification · Severity scoring",
    output: "ROAD / PUBLIC WORKS / HIGH",
    hitl: false,
  },
  {
    num: "05",
    name: "Geospatial Correlation Agent",
    role: "Connects complaint with spatial and infrastructure data.",
    input: "Structured grievance + confirmed location",
    process: "Spatial join with infrastructure, demographics, PM Gati Shakti layers",
    output: "Cluster coordinates, Red Zone flag, infrastructure context",
    hitl: false,
  },
  {
    num: "06",
    name: "Policy Dashboard Agent",
    role: "Converts analysis into actionable policy intelligence.",
    input: "Cluster analysis",
    process: null,
    output: "Executive summary · Budget recommendation · Red Zone map",
    hitl: false,
  },
];

export function AgentsSection() {
  return (
    <SectionBase id="architecture" number="05" label="The AI Pipeline">
      <div className="agents-heading reveal">
        <h2 className="editorial-h2">Five stages.<br />One intelligence pipeline.</h2>
      </div>

      <div className="agents-list">
        {AGENTS.map((agent, i) => (
          <div
            key={agent.num}
            className={`agents-row reveal ${agent.hitl ? "agents-row-hitl" : ""}`}
            style={{ transitionDelay: `${i * 0.06}s` }}
          >
            <div className="agents-row-num">
              <span className="section-number">{agent.num}</span>
            </div>
            <div className="agents-row-body">
              <div className="agents-row-header">
                <h3 className="agents-name">{agent.name}</h3>
                {agent.hitl && <span className="hitl-badge">HUMAN CHECKPOINT</span>}
              </div>
              <p className="body-md agents-role">{agent.role}</p>
              {(agent.input || agent.process || agent.output) && (
                <div className="agents-io">
                  {agent.input && (
                    <div className="agents-io-row">
                      <span className="agents-io-label">INPUT</span>
                      <span className="agents-io-value">{agent.input}</span>
                    </div>
                  )}
                  {agent.process && (
                    <div className="agents-io-row">
                      <span className="agents-io-label">PROCESS</span>
                      <span className="agents-io-value">{agent.process}</span>
                    </div>
                  )}
                  {agent.output && (
                    <div className="agents-io-row">
                      <span className="agents-io-label">OUTPUT</span>
                      <span className={`agents-io-value ${agent.hitl ? "" : "agents-output"}`}>{agent.output}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="agents-footer reveal">
        <p className="disclaimer">AI RECOMMENDS. HUMANS REMAIN ACCOUNTABLE.</p>
      </div>
    </SectionBase>
  );
}
