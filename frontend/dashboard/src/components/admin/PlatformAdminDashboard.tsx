import React, { useState, useEffect } from "react";
import { auth } from "../../config/firebase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const PlatformAdminDashboard: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/admin/system/health`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setHealth(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1 className="editorial-h2">Platform Admin Dashboard</h1>
      <p style={{ color: "var(--col-text-mid)", marginBottom: "24px" }}>System health and API key management.</p>

      <div className="form-card" style={{ padding: "20px", marginBottom: "24px" }}>
        <h3 className="editorial-h3">System Health</h3>
        {health ? (
          <div style={{ marginTop: "16px", background: "#f8fafc", padding: "16px", borderRadius: "8px", display: "flex", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ height: "10px", width: "10px", borderRadius: "50%", backgroundColor: health.status === "ok" ? "var(--col-green)" : "var(--col-red)" }}></span>
              <strong>Status:</strong> {health.status}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ height: "10px", width: "10px", borderRadius: "50%", backgroundColor: health.db === "connected" || health.database === "connected" ? "var(--col-green)" : "var(--col-red)" }}></span>
              <strong>Database:</strong> {health.db || health.database}
            </div>
          </div>
        ) : (
          <p style={{ marginTop: "16px", color: "var(--col-text-muted)" }}>Checking system health...</p>
        )}
      </div>

      <div className="form-card" style={{ padding: "20px" }}>
        <h3 className="editorial-h3">Bhashini / GenAI API Keys</h3>
        <p style={{ color: "var(--col-text-mid)", fontSize: "13px", marginTop: "8px" }}>
          Manage external integrations for semantic parsing and translations.
        </p>
        <div style={{ marginTop: "16px" }}>
          <button className="btn-outline" onClick={() => window.location.href = "/admin/platform/keys"}>Manage Keys</button>
        </div>
      </div>
    </div>
  );
};
