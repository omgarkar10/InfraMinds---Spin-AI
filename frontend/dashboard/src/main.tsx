import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/editorial.css";
import "./styles/dashboard.css";
import "./styles/citizen.css";
import "./styles/chatbot.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
