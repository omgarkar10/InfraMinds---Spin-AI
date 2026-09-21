import { useState } from "react";
import { CitizenChat } from "./CitizenChat";


export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen((prev) => !prev);


  return (
    <div className="chatbot-widget-container">
      {isOpen && (
        <div className="chatbot-window">
          {/* We use a relative container inside the window so we can position the close button */}
          <div style={{ position: "relative", height: "100%", width: "100%" }}>
            <button className="close-chat-btn" onClick={toggleChat} title="Close chat">
              &times;
            </button>
            <CitizenChat />
          </div>
        </div>
      )}
      
      <button className="chatbot-fab" onClick={toggleChat} title="Open Chat">
        💬
      </button>
    </div>
  );
}
