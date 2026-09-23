import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { getMyRequestsFromBackend } from "../../services/grievanceService";
import type { CitizenUser } from "../../types";

interface TrackGrievancesProps {
  user: CitizenUser;
  onNavigate: (view: string, grievanceId?: string) => void;
}

export const TrackGrievances: React.FC<TrackGrievancesProps> = ({ user, onNavigate }) => {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchId, setSearchId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  useEffect(() => {
    async function loadRequests() {
      if (!user.isLoggedIn) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getMyRequestsFromBackend();
        setGrievances(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load requests from authoritative registry.");
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [user.isLoggedIn]);

  /* Filter Logic */
  const filtered = grievances.filter((g) => {
    const id = g.grievance_id || g.id || "";
    if (searchId && !id.toLowerCase().includes(searchId.toLowerCase())) return false;
    if (selectedCategory && g.category !== selectedCategory) return false;
    if (selectedStatus && g.status !== selectedStatus) return false;
    if (selectedType && g.request_type !== selectedType) return false;
    return true;
  });

  const totalCount = grievances.length;
  const activeCount = grievances.filter((g) => g.status !== "RESOLVED").length;
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length;

  return (
    <div className="citizen-portal-container">
      {/* Top Header */}
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
              ← Back to Dashboard
            </button>

            <div className="portal-title-group">
              <span className="portal-org">SPIN · CITIZEN SERVICES</span>
              <h1 className="portal-heading" style={{ fontSize: "24px" }}>My Submitted Requests</h1>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                Official tracking registry for your public infrastructure demands and grievances.
              </p>
            </div>
          </div>

          <button className="service-card-btn service-card-btn-orange" onClick={() => onNavigate("citizen-raise")}>
            + Submit New Request
          </button>
        </div>
      </div>

      <div className="container">
        {/* Real Summary Cards (0 for new user, no fake seed numbers) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div className="stat-card">
            <span className="stat-label">TOTAL REQUESTS</span>
            <span className="stat-value">{loading ? "..." : totalCount}</span>
          </div>
          <div className="stat-card accent">
            <span className="stat-label">ACTIVE / UNDER REVIEW</span>
            <span className="stat-value" style={{ color: "var(--col-orange)" }}>{loading ? "..." : activeCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">OFFICIALLY RESOLVED</span>
            <span className="stat-value" style={{ color: "var(--col-green)" }}>{loading ? "..." : resolvedCount}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="form-card" style={{ padding: "16px", marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>Search Request ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by ID (e.g. SPIN-2026-XXXXXX)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                style={{ fontSize: "13px" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>Type</label>
              <select
                className="form-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{ fontSize: "13px" }}
              >
                <option value="">All Types</option>
                <option value="existing_problem">Existing Problem</option>
                <option value="new_development">New Development</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ fontSize: "13px" }}
              >
                <option value="">All Categories</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Roads & Potholes">Roads &amp; Potholes</option>
                <option value="Electricity">Electricity</option>
                <option value="Drainage / Flooding">Drainage / Flooding</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Healthcare & Hospitals">Healthcare &amp; Hospitals</option>
                <option value="Education">Education</option>
                <option value="Public Transport">Public Transport</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px" }}>Status</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ fontSize: "13px" }}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Requests List / Clean Empty State */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {loading ? (
            <div className="form-card" style={{ textAlign: "center", padding: "40px" }}>
              <p className="portal-subtext">Loading verified submissions from backend registry...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="form-card" style={{ textAlign: "center", padding: "48px 16px" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>📋</div>
              <h3 style={{ color: "var(--col-navy)", fontSize: "18px", margin: "0 0 8px 0" }}>
                {grievances.length === 0 ? "No Requests Submitted Yet" : "No Matching Requests Found"}
              </h3>
              <p className="portal-subtext" style={{ maxWidth: "460px", margin: "0 auto 16px auto" }}>
                {grievances.length === 0
                  ? "You have not submitted any infrastructure demands yet. Once registered, your official tracking status will appear here."
                  : "Try clearing your search query or filter selection to see all requests."}
              </p>
              {grievances.length === 0 && (
                <button
                  type="button"
                  className="service-card-btn service-card-btn-orange"
                  style={{ display: "inline-block" }}
                  onClick={() => onNavigate("citizen-raise")}
                >
                  + Submit Your First Request
                </button>
              )}
            </div>
          ) : (
            filtered.map((g) => {
              const reqId = g.grievance_id || g.id;
              const isNewDev = g.request_type === "new_development";
              return (
                <div key={reqId} className="form-card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="mono" style={{ fontSize: "16px", fontWeight: "700", color: "var(--col-navy)" }}>
                          {reqId}
                        </span>
                        <span className={`status-pill ${g.status || "SUBMITTED"}`}>
                          {(g.status || "SUBMITTED").replace(/_/g, " ")}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: isNewDev ? "rgba(59, 130, 246, 0.1)" : "rgba(224, 90, 43, 0.1)",
                            color: isNewDev ? "#2563eb" : "var(--col-orange)",
                            fontWeight: 600,
                          }}
                        >
                          {isNewDev ? "🏗️ New Development" : "⚠️ Existing Problem"}
                        </span>
                      </div>
                      <strong style={{ fontSize: "16px", color: "var(--col-navy)" }}>
                        {g.category} — {g.specific_issue || g.issueType || "General"}
                      </strong>
                      <span className="body-sm" style={{ color: "var(--col-text-mid)" }}>
                        📍 {g.address || g.district || "Location on Record"}, {g.state || ""}
                      </span>
                    </div>

                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                      <span className="body-sm" style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>
                        Submitted: {g.created_at ? new Date(g.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Today"}
                      </span>
                      <button
                        className="service-card-btn"
                        style={{ padding: "6px 16px", fontSize: "12px" }}
                        onClick={() => onNavigate("citizen-detail", reqId)}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: "12px", background: "var(--col-panel)", padding: "10px 14px", borderRadius: "6px", fontSize: "12px", color: "var(--col-text-mid)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <span><strong>Routing:</strong> {g.domain || g.category || "Municipal Authority"}</span>
                    <span><strong>Database Persistence:</strong> Authoritative SQLite</span>
                    <span><strong>Cloud Warehouse:</strong> {g.bigquery_synced ? "✓ Synced" : "Pending Scheduled Batch"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
