import { SectionBase } from "./SectionBase";
import "./AgentsSection.css";

interface AgentSpec {
  num: string;
  name: string;
  role: string;
  input: string;
  process: string;
  output: string;
  hitl?: boolean;
}

const AGENT_PIPELINE: AgentSpec[] = [
  {
    num: "01",
    name: "Root Orchestrator Agent",
    role: "Orchestrates full agent pipeline execution, state transitions, and error recovery.",
    input: "Trigger event (New citizen message, schedule trigger, or API call)",
    process: "DAG task scheduling, agent state management, error handling",
    output: "Pipeline Execution State & Audit Log",
  },
  {
    num: "02",
    name: "Chatbot Intake Agent",
    role: "Receives raw citizen input via messaging webhooks and normalizes intake payloads.",
    input: "Citizen voice note, text message, photo, or GPS metadata",
    process: "Channel intake normalization, Bhashini ASR triggering, media extraction",
    output: "Normalized Unverified Intake Payload",
  },
  {
    num: "03",
    name: "HITL Location Gate Agent",
    hitl: true,
    role: "Human-in-the-loop checkpoint ensuring location context is verified before analysis.",
    input: "Normalized Intake Payload with low location confidence (<80%)",
    process: "Operator landmark confirmation or automated SMS landmark prompt to citizen",
    output: "Validated Spatial Signal JSON",
  },
  {
    num: "04",
    name: "Semantic Parsing Agent",
    role: "Converts natural language into structured infrastructure intelligence.",
    input: "Translated English grievance text",
    process: "Entity extraction, infrastructure domain categorization, severity scoring (0–10)",
    output: "Structured Grievance JSON Payload",
  },
  {
    num: "05",
    name: "Geospatial Correlation Agent",
    role: "Connects structured grievances with GIS infrastructure layers and demographic grids.",
    input: "Structured Grievance JSON + GIS coordinates",
    process: "Spatial join with PM Gati Shakti layers, density clustering algorithm",
    output: "Clustered Demand Map & Red Zone Alert Flag",
  },
  {
    num: "06",
    name: "Policy Dashboard Agent",
    role: "Synthesizes geospatial clusters into actionable policy briefs for human decision makers.",
    input: "Red Zone spatial cluster data + department budget allocations",
    process: "Executive summary generation, priority ranking, budget diff modeling",
    output: "Executive Brief & Recommended Budget Reallocation",
  },
];

export function AgentsSection() {
  return (
    <SectionBase id="architecture" number="05" label="THE AI AGENT ARCHITECTURE">
      <div className="agents-heading">
        <h2 className="editorial-h2">
          Modular software agents.<br />
          <span className="problem-h2-highlight">Decoupled, deterministic, and auditable.</span>
        </h2>
        <p className="body-lg agents-subtitle">
          SPIN uses a multi-agent software architecture where each agent performs a single dedicated function within the pipeline.
        </p>
      </div>

      {/* Agent Specifications Grid */}
      <div className="agents-spec-grid">
        {AGENT_PIPELINE.map((agent) => (
          <div key={agent.num} className={`agent-card ${agent.hitl ? "hitl-card" : ""}`}>
            <div className="agent-card-header">
              <span className="agent-num">{agent.num}</span>
              <h3 className="agent-name">{agent.name}</h3>
              {agent.hitl && <span className="hitl-badge">HUMAN GATEWAY</span>}
            </div>

            <p className="agent-role font-medium">{agent.role}</p>

            <div className="agent-io-specs">
              <div className="io-spec-row">
                <span className="io-spec-label">ROLE:</span>
                <span className="io-spec-val">{agent.role}</span>
              </div>
              <div className="io-spec-row">
                <span className="io-spec-label">INPUT:</span>
                <span className="io-spec-val">{agent.input}</span>
              </div>
              <div className="io-spec-row">
                <span className="io-spec-label">PROCESS:</span>
                <span className="io-spec-val">{agent.process}</span>
              </div>
              <div className="io-spec-row">
                <span className="io-spec-label">OUTPUT:</span>
                <span className="io-spec-val highlight">{agent.output}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DEDICATED HUMAN-IN-THE-LOOP (HITL) FEATURE BLOCK */}
      <div className="hitl-feature-block">
        <div className="hitl-block-header">
          <span className="label-eyebrow tag-orange">RESPONSIBLE AI GOVERNANCE</span>
          <h3 className="editorial-h3">AI DOES NOT MAKE EVERY DECISION.</h3>
          <p className="body-md">
            If location, severity or evidence is insufficient, SPIN pauses automated processing and requests human/citizen confirmation.
          </p>
        </div>

        {/* HITL Flow Visual */}
        <div className="hitl-flow-visual">
          <div className="hitl-flow-step">
            <span className="step-tag">AI ENGINE</span>
            <strong>Intake Processing</strong>
          </div>

          <span className="hitl-flow-arrow">→</span>

          <div className="hitl-flow-step warning">
            <span className="step-tag warning">UNCERTAINTY DETECTED</span>
            <strong>Location Confidence &lt;80%</strong>
          </div>

          <span className="hitl-flow-arrow">→</span>

          <div className="hitl-flow-step human">
            <span className="step-tag human">HUMAN REVIEW</span>
            <strong>Operator Confirm / SMS Landmark</strong>
          </div>

          <span className="hitl-flow-arrow">→</span>

          <div className="hitl-flow-step success">
            <span className="step-tag success">CONFIRMED SIGNAL</span>
            <strong>Pipeline Resumes</strong>
          </div>
        </div>

        <div className="hitl-footer-note">
          <span className="disclaimer">HUMAN-IN-THE-LOOP GATEWAY ENFORCES ACCOUNTABILITY AT ALL TIMES</span>
        </div>
      </div>
    </SectionBase>
  );
}

