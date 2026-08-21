import { useState } from "react";

interface CitizenChatProps {
  apiUrl?: string;
}

interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

export function CitizenChat({ apiUrl = "" }: CitizenChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "What is the issue?" },
  ]);
  const [input, setInput] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [step, setStep] = useState<"issue" | "location" | "done">("issue");
  const [loading, setLoading] = useState(false);

  const requestLocation = (issueText: string) => {
    if (!navigator.geolocation) {
      setMessages((m) => [...m, { role: "bot", text: "Please type your nearest landmark." }]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Location captured. Submitting your grievance…" },
        ]);
        setStep("done");
        submit(issueText, loc);
      },
      () => setMessages((m) => [...m, { role: "bot", text: "Could not get GPS. Type a landmark." }])
    );
  };

  const submit = async (issueText: string, loc: { lat: number; lng: number } | null) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/pipeline/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: `citizen-${Date.now()}`,
          text: issueText,
          source_language: "hi",
          location: loc,
        }),
      });
      const data = await res.json();
      if (data.status === "awaiting_location") {
        setMessages((m) => [...m, { role: "bot", text: data.prompt }]);
        return;
      }
      const summary = data.policy_output?.executive_summary;
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text:
            summary ??
            data.prompt ??
            "Grievance registered. You will be notified when action is taken.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    if (step === "issue") {
      setStep("location");
      setMessages((m) => [...m, { role: "bot", text: "Where is it located?" }]);
      requestLocation(text);
    }
  };

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
      </div>

      <div className="chat-input-row">
        <button className="voice-btn" title="Voice recording (via Bhashini ASR)">
          🎤
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={step === "issue" ? "Describe the issue…" : "Share location or landmark…"}
          className="chat-input"
        />
        <button className="send-btn" onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
