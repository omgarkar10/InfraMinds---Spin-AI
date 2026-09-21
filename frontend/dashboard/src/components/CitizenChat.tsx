/**
 * CitizenChat view — thin wrapper over useCitizenChat hook.
 * All logic lives in useCitizenChat.ts.
 */
import { useCitizenChat } from "../hooks/useCitizenChat";

const DEPARTMENT_OPTIONS = [
  "🚰 Water Supply",
  "🛣️ Roads & Traffic",
  "🗑️ Sanitation & Waste",
  "💡 Electricity & Lighting",
  "🏥 Public Health",
  "🏢 Other Department",
];

const SUB_DEPT_MAP: Record<string, string[]> = {
  "🚰 Water Supply": ["Pipeline Leakage / Burst", "Contaminated / Dirty Water", "No Water Supply", "Low Water Pressure", "Billing & Meter Issue"],
  "🛣️ Roads & Traffic": ["Pothole / Damaged Road", "Traffic Signal Failure", "Street Light Not Working", "Waterlogging / Flooding", "Illegal Encroachment"],
  "🗑️ Sanitation & Waste": ["Garbage Dump / Uncollected Waste", "Overflowing Drain / Sewage", "Dead Animal Removal", "Public Toilet Maintenance"],
  "💡 Electricity & Lighting": ["Power Outage / Fluctuation", "Dangling High-Voltage Wire", "Street Light Broken", "Transformer Hazard"],
  "🏥 Public Health": ["Mosquito / Pest Breeding", "Stray Animals Hazard", "Hospital / Clinic Service", "Food Hygiene Violation"],
};

const DEFAULT_SUB_DEPTS = ["General Complaint", "Maintenance Request", "Urgent Safety Hazard", "Other Issue"];
const DESC_TEMPLATES = [
  "⏭️ Skip Description (Optional)",
  "Severe issue causing inconvenience to residents",
  "Recurring problem for over 3 days",
  "Immediate safety hazard to pedestrians / vehicles",
  "Requires urgent municipal inspection",
];
const LOCATION_OPTIONS = [
  "📍 Use Current GPS Location",
  "Zone 1 (North District)",
  "Zone 2 (South District)",
  "City Center / Main Market",
  "Ward Office / Municipal Area",
];
const FEEDBACK_OPTIONS = ["👍 Yes, very helpful", "👎 Needs Improvement"];

function getOptionsForStep(step: string, dept: string): string[] {
  switch (step) {
    case "ask_register": return ["Yes, Register Grievance", "No, Just Browsing"];
    case "dept":         return DEPARTMENT_OPTIONS;
    case "sub_dept":     return (dept && SUB_DEPT_MAP[dept]) || DEFAULT_SUB_DEPTS;
    case "desc":         return DESC_TEMPLATES;
    case "loc":          return LOCATION_OPTIONS;
    case "feedback":     return FEEDBACK_OPTIONS;
    case "done":         return ["🔄 Register Another Grievance"];
    default:             return [];
  }
}

export function CitizenChat() {
  const {
    messages, input, setInput, step, grievanceData,
    loading, isListening, messagesEndRef,
    toggleListen, handleSend, handleOptionClick,
  } = useCitizenChat();

  const currentOptions = loading ? [] : getOptionsForStep(step, grievanceData.dept);

  return (
    <div className="citizen-chat">
      <header className="citizen-header">
        <h1>SPIN</h1>
        <p>Report infrastructure issues in your language</p>
      </header>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>{msg.text}</div>
        ))}
        {loading && <div className="chat-bubble bot">Processing…</div>}

        {!loading && currentOptions.length > 0 && (
          <div className="chat-options-container">
            {currentOptions.map((opt, idx) => (
              <button key={idx} type="button" className="chat-option-btn" onClick={() => handleOptionClick(opt)}>
                {opt}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-row">
        <button
          className="voice-btn"
          title="Voice recording (via Browser ASR)"
          onClick={toggleListen}
          style={{ color: isListening ? "var(--col-red)" : "inherit" }}
        >
          {isListening ? "🔴" : "🎤"}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={step === "done" ? "Chat completed." : "Or type custom message / landmark..."}
          disabled={step === "done" || loading}
          className="chat-input"
        />
        <button className="send-btn" onClick={handleSend} disabled={step === "done" || loading}>
          Send
        </button>
      </div>
    </div>
  );
}
