/**
 * useCitizenChat — extracted state machine for the CitizenChat component.
 *
 * Responsibilities:
 *   - Manages chat messages, step progression, grievance data collection
 *   - Handles voice input, GPS location request, and API submission
 *   - Returns only what the view layer needs (no DOM, no JSX)
 */
import { useState, useRef, useEffect } from "react";
import { apiClient } from "../services/apiClient";

export interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

export type ChatStep = "ask_register" | "dept" | "sub_dept" | "desc" | "loc" | "confirm" | "feedback" | "done";

interface GrievanceData {
  dept: string;
  subDept: string;
  desc: string;
  loc: { lat: number; lng: number } | string | null;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { role: "bot", text: "Hello! Welcome to SPIN civic portal." },
  { role: "bot", text: "Would you like to register a grievance?" },
];

const INITIAL_GRIEVANCE_DATA: GrievanceData = { dept: "", subDept: "", desc: "", loc: null };

export function useCitizenChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<ChatStep>("ask_register");
  const [grievanceData, setGrievanceData] = useState<GrievanceData>(INITIAL_GRIEVANCE_DATA);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, step]);

  const toggleListen = () => {
    if (isListening) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      const data = await apiClient.post<any>("/api/pipeline/run", {
        user_id: `citizen-${Date.now()}`,
        text: fullIssueText,
        source_language: "auto",
        location: typeof loc === "string" ? { landmark: loc } : loc,
      });
      const summary = data.policy_output?.executive_summary;
      let confirmationText = `✅ Grievance recorded with ID: ${generatedId}.`;
      if (summary && !data.policy_output?.is_fallback) {
        confirmationText += `\nSummary: ${summary}`;
      }
      setMessages((m) => [
        ...m,
        { role: "bot", text: confirmationText },
        { role: "bot", text: "Was this chatbot helpful?" },
      ]);
      setStep("feedback");
    } catch (err) {
      console.warn("Backend pipeline offline, mock response returned:", err);
      setMessages((m) => [
        ...m,
        { role: "bot", text: `✅ Grievance saved locally with ID: ${generatedId} (Demo Mode — backend offline).` },
        { role: "bot", text: "Was this chatbot helpful?" },
      ]);
      setStep("feedback");
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = (desc: string, currentDept?: string, currentSubDept?: string) => {
    if (!navigator.geolocation) {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "GPS not supported on this browser. Please select a zone or type a landmark below." },
      ]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGrievanceData((prev) => ({ ...prev, loc }));
        setMessages((m) => [
          ...m,
          { role: "bot", text: `📍 GPS captured (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}). Submitting…` },
        ]);
        submit(desc, loc, currentDept, currentSubDept);
      },
      () =>
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Could not retrieve GPS location. Please select a zone or type a landmark below." },
        ])
    );
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
      setMessages((m) => [...m, { role: "bot", text: `Department: ${text}. Please choose the category:` }]);
      setStep("sub_dept");
    } else if (step === "sub_dept") {
      setGrievanceData((prev) => ({ ...prev, subDept: text }));
      setMessages((m) => [...m, { role: "bot", text: "Please select a description or type details:" }]);
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
        setMessages((m) => [...m, { role: "bot", text: `Location recorded: "${text}". Submitting…` }]);
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
      setMessages(INITIAL_MESSAGES);
      setStep("ask_register");
      setGrievanceData(INITIAL_GRIEVANCE_DATA);
      return;
    }
    processInput(option);
  };

  const reset = () => {
    setMessages(INITIAL_MESSAGES);
    setStep("ask_register");
    setGrievanceData(INITIAL_GRIEVANCE_DATA);
    setInput("");
  };

  return {
    messages,
    input,
    setInput,
    step,
    grievanceData,
    loading,
    isListening,
    messagesEndRef,
    toggleListen,
    handleSend,
    handleOptionClick,
    reset,
  };
}
