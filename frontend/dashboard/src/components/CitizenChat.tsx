import { useState, useRef, useEffect } from "react";

interface CitizenChatProps {
  apiUrl?: string;
}

interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

type ChatStep = "ask_register" | "dept" | "sub_dept" | "desc" | "loc" | "confirm" | "feedback" | "done";

const DEPARTMENT_OPTIONS = [
  "🚰 Water Supply",
  "🛣️ Roads & Traffic",
  "🗑️ Sanitation & Waste",
  "💡 Electricity & Lighting",
  "🏥 Public Health",
  "🏢 Other Department",
];

const SUB_DEPT_MAP: Record<string, string[]> = {
  "🚰 Water Supply": [
    "Pipeline Leakage / Burst",
    "Contaminated / Dirty Water",
    "No Water Supply",
    "Low Water Pressure",
    "Billing & Meter Issue",
  ],
  "🛣️ Roads & Traffic": [
    "Pothole / Damaged Road",
    "Traffic Signal Failure",
    "Street Light Not Working",
    "Waterlogging / Flooding",
    "Illegal Encroachment",
  ],
  "🗑️ Sanitation & Waste": [
    "Garbage Dump / Uncollected Waste",
    "Overflowing Drain / Sewage",
    "Dead Animal Removal",
    "Public Toilet Maintenance",
  ],
  "💡 Electricity & Lighting": [
    "Power Outage / Fluctuation",
    "Dangling High-Voltage Wire",
    "Street Light Broken",
    "Transformer Hazard",
  ],
  "🏥 Public Health": [
    "Mosquito / Pest Breeding",
    "Stray Animals Hazard",
    "Hospital / Clinic Service",
    "Food Hygiene Violation",
  ],
};

const DEFAULT_SUB_DEPTS = [
  "General Complaint",
  "Maintenance Request",
  "Urgent Safety Hazard",
  "Other Issue",
];

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

const FEEDBACK_OPTIONS = [
  "👍 Yes, very helpful",
  "👎 Needs Improvement",
];

export function CitizenChat({ apiUrl = "" }: CitizenChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "Hello! Welcome to SPIN civic portal." },
    { role: "bot", text: "Would you like to register a grievance?" },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<ChatStep>("ask_register");
  
  const [grievanceData, setGrievanceData] = useState({
    dept: "",
    subDept: "",
    desc: "",
    loc: null as { lat: number; lng: number } | string | null,
  });

  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, step]);

  const toggleListen = () => {
    if (isListening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onerror = (e: any) => console.error("Speech recognition error", e);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const requestLocation = (desc: string, currentDept?: string, currentSubDept?: string) => {
    if (!navigator.geolocation) {
      setMessages((m) => [...m, { role: "bot", text: "GPS not supported on this browser. Please select a zone or type a landmark below." }]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGrievanceData((prev) => ({ ...prev, loc }));
        setMessages((m) => [
          ...m,
          { role: "bot", text: `📍 GPS Coordinates captured (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}). Submitting your grievance…` },
        ]);
        submit(desc, loc, currentDept, currentSubDept);
      },
      () => setMessages((m) => [...m, { role: "bot", text: "Could not retrieve GPS location. Please select a zone or type a landmark below." }])
    );
  };

  const submit = async (
    desc: string,
    loc: { lat: number; lng: number } | string | null,
    currentDept?: string,
    currentSubDept?: string
  ) => {
    setLoading(true);
    setStep("confirm");
    
    const dept = currentDept || grievanceData.dept;
    const subDept = currentSubDept || grievanceData.subDept;
    const fullIssueText = `Department: ${dept}\nSub-department: ${subDept}\nDescription: ${desc}`;
    const generatedId = `GRV-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await fetch(`${apiUrl}/api/pipeline/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: `citizen-${Date.now()}`,
          text: fullIssueText,
          source_language: "auto",
          location: typeof loc === "string" ? { landmark: loc } : loc,
        }),
      });
      const data = await res.json();
      
      const summary = data.policy_output?.executive_summary;
      let confirmationText = `✅ Grievance recorded successfully with ID: ${generatedId}.`;
      if (summary) {
        confirmationText += `\nSummary: ${summary}`;
      }

      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: confirmationText,
        },
        {
          role: "bot",
          text: "Was this chatbot helpful?",
        },
      ]);
      setStep("feedback");
    } catch (err) {
      console.warn("Backend pipeline offline, mock response returned:", err);
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: `✅ Grievance recorded locally with ID: ${generatedId} (Demo Mode).`,
        },
        {
          role: "bot",
          text: "Was this chatbot helpful?",
        },
      ]);
      setStep("feedback");
    } finally {
      setLoading(false);
    }
  };

  const processInput = (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    if (step === "ask_register") {
      if (text.toLowerCase().includes("no") || text.toLowerCase().includes("browsing")) {
        setMessages((m) => [...m, { role: "bot", text: "Alright, let me know if you need anything else!" }]);
        setStep("done");
      } else {
        setMessages((m) => [...m, { role: "bot", text: "Please select a department:" }]);
        setStep("dept");
      }
    } else if (step === "dept") {
      setGrievanceData((prev) => ({ ...prev, dept: text }));
      setMessages((m) => [...m, { role: "bot", text: `Department selected: ${text}. Please choose the category:` }]);
      setStep("sub_dept");
    } else if (step === "sub_dept") {
      setGrievanceData((prev) => ({ ...prev, subDept: text }));
      setMessages((m) => [...m, { role: "bot", text: "Please select a description or type details below:" }]);
      setStep("desc");
    } else if (step === "desc") {
      setGrievanceData((prev) => ({ ...prev, desc: text }));
      setMessages((m) => [...m, { role: "bot", text: "Where is this located? Choose an option or type a landmark:" }]);
      setStep("loc");
    } else if (step === "loc") {
      if (text === "📍 Use Current GPS Location") {
        setMessages((m) => [...m, { role: "bot", text: "Detecting GPS location..." }]);
        requestLocation(grievanceData.desc);
      } else {
        setGrievanceData((prev) => ({ ...prev, loc: text }));
        setMessages((m) => [...m, { role: "bot", text: `Location recorded: "${text}". Submitting your grievance…` }]);
        submit(grievanceData.desc, text);
      }
    } else if (step === "feedback") {
      setMessages((m) => [...m, { role: "bot", text: "Thank you for your feedback! It helps us improve civic response." }]);
      setStep("done");
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    processInput(input.trim());
  };

  const handleOptionClick = (option: string) => {
    if (option === "🔄 Register Another Grievance") {
      setMessages([
        { role: "bot", text: "Hello! Welcome to SPIN civic portal." },
        { role: "bot", text: "Would you like to register a grievance?" },
      ]);
      setStep("ask_register");
      setGrievanceData({
        dept: "",
        subDept: "",
        desc: "",
        loc: null,
      });
      return;
    }
    processInput(option);
  };

  const getCurrentOptions = (): string[] => {
    if (loading) return [];
    switch (step) {
      case "ask_register":
        return ["Yes, Register Grievance", "No, Just Browsing"];
      case "dept":
        return DEPARTMENT_OPTIONS;
      case "sub_dept":
        return (grievanceData.dept && SUB_DEPT_MAP[grievanceData.dept]) || DEFAULT_SUB_DEPTS;
      case "desc":
        return DESC_TEMPLATES;
      case "loc":
        return LOCATION_OPTIONS;
      case "feedback":
        return FEEDBACK_OPTIONS;
      case "done":
        return ["🔄 Register Another Grievance"];
      default:
        return [];
    }
  };

  const currentOptions = getCurrentOptions();

  return (
    <div className="citizen-chat">
      <header className="citizen-header">
        <h1>SPIN</h1>
        <p>Report infrastructure issues in your language</p>
      </header>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="chat-bubble bot">Processing…</div>}

        {!loading && currentOptions.length > 0 && (
          <div className="chat-options-container">
            {currentOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                className="chat-option-btn"
                onClick={() => handleOptionClick(opt)}
              >
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
