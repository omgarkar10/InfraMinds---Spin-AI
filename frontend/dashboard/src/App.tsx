import { useState } from "react";
import { PolicyDashboard } from "./components/PolicyDashboard";
import { CitizenChat } from "./components/CitizenChat";

type View = "citizen" | "policymaker";

export function App() {
  const [view, setView] = useState<View>("policymaker");

  return (
    <>
      <nav className="view-nav">
        <button
          className={view === "citizen" ? "active" : ""}
          onClick={() => setView("citizen")}
        >
          Citizen
        </button>
        <button
          className={view === "policymaker" ? "active" : ""}
          onClick={() => setView("policymaker")}
        >
          Policymaker
        </button>
      </nav>
      {view === "citizen" ? <CitizenChat /> : <PolicyDashboard />}
    </>
  );
}
