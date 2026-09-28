import React, { useState, useEffect } from "react";
import type { CitizenUser } from "../../types";
import "../../styles/citizen.css";
import { getMyRequestsFromBackend } from "../../services/demandService";

interface CitizenProfileProps {
  user: CitizenUser;
  onNavigate: (view: string, id?: string) => void;
}

export const CitizenProfile: React.FC<CitizenProfileProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<"submissions" | "supported">("submissions");
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getMyRequestsFromBackend();
        setDemands(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="citizen-portal-container">
      <div className="portal-header-bar">
        <div className="container portal-header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              className="btn-outline"
              style={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.1)",
                fontSize: "12px",
                fontWeight: "700",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={() => onNavigate("citizen")}
            >
              ← Back to Feed
            </button>
            <div className="portal-title-group">
              <span className="portal-org">CITIZEN PROFILE</span>
              <h1 className="portal-heading" style={{ fontSize: "24px" }}>My Activity</h1>
            </div>
          </div>
          <div>
            <button
              className="btn-outline"
              style={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.1)",
                fontSize: "12px",
                fontWeight: "700",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={() => onNavigate("citizen-logout")}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
        {/* Profile Sidebar */}
        <div className="form-card" style={{ padding: "24px", height: "fit-content" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👤</div>
            <h2 style={{ fontSize: "20px", margin: "0 0 8px 0" }}>{user.name || "Citizen"}</h2>
            <div style={{
              display: "inline-block",
              background: "rgba(34, 197, 94, 0.1)",
              color: "#16a34a",
              padding: "4px 12px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: "600"
            }}>
              ✓ Verified Resident
            </div>
          </div>
          
          <div style={{ borderTop: "1px solid #eee", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>Email</div>
              <div style={{ fontSize: "14px", wordBreak: "break-all" }}>{user.email || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>Date of Birth</div>
              <div style={{ fontSize: "14px" }}>{user.dob ? new Date(user.dob + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>Phone Number</div>
              <div style={{ fontSize: "14px" }}>{user.phone || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>Citizen ID</div>
              <div style={{ fontSize: "14px", fontFamily: "monospace" }}>{user.id}</div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="form-card" style={{ padding: "0" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
            <button
              onClick={() => setActiveTab("submissions")}
              style={{
                flex: 1,
                padding: "16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "submissions" ? "2px solid var(--col-navy)" : "2px solid transparent",
                fontWeight: activeTab === "submissions" ? "700" : "500",
                color: activeTab === "submissions" ? "var(--col-navy)" : "#666",
                cursor: "pointer"
              }}
            >
              My Submissions
            </button>
            <button
              onClick={() => setActiveTab("supported")}
              style={{
                flex: 1,
                padding: "16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "supported" ? "2px solid var(--col-navy)" : "2px solid transparent",
                fontWeight: activeTab === "supported" ? "700" : "500",
                color: activeTab === "supported" ? "var(--col-navy)" : "#666",
                cursor: "pointer"
              }}
            >
              Demands I Supported
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ padding: "24px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Loading records...</div>
            ) : activeTab === "submissions" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {demands.length === 0 ? (
                   <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>You haven't submitted any demands yet.</div>
                ) : (
                  demands.map(d => (
                    <div key={d.id} style={{ border: "1px solid #eee", padding: "16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "600", color: "var(--col-navy)" }}>{d.category} — {d.specific_issue || "Proposal"}</div>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Status: {d.status || "SUBMITTED"}</div>
                      </div>
                      <button className="service-card-btn" style={{ padding: "6px 16px", fontSize: "12px" }} onClick={() => onNavigate("citizen-detail", d.id)}>View</button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Mock for supported demands for now since we don't have a getSupportedDemands API */}
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>You haven't supported any demands yet. Upvote demands on the main feed to see them here.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
