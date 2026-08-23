import { useState } from "react";
import { CitizenChat } from "./CitizenChat";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen((prev) => !prev);

  // You can set the API URL based on your env vars
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

  return (
    <div className="chatbot-widget-container">
      {isOpen && (
        <div className="chatbot-window">
          {/* We use a relative container inside the window so we can position the close button */}
          <div style={{ position: "relative", height: "100%", width: "100%" }}>
            <button className="close-chat-btn" onClick={toggleChat} title="Close chat">
              &times;
            </button>
            <CitizenChat apiUrl={apiUrl} />
          </div>
        </div>
      )}
      
      <button className="chatbot-fab" onClick={toggleChat} title="Open Chat">
        💬
      </button>
    </div>
  );
}
