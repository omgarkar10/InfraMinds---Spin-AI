import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { getMyRequestsFromBackend } from "../../services/demandService";
import type { CitizenUser } from "../../types";

import { useNavigate } from "react-router-dom";

interface TrackDemandsProps {
  user: CitizenUser;
}

export const TrackDemands: React.FC<TrackDemandsProps> = ({ user }) => {
  const navigate = useNavigate();
  const formatLocation = (g: any) => {
    return [g.landmark, g.address, g.district, g.state]
      .filter(val => Boolean(val) && val !== "None" && val !== "Unknown")
      .join(", ");
  };
  const [proposals, setDemands] = useState<any[]>([]);
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
        setDemands(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load requests from authoritative registry.");
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [user.isLoggedIn]);

  /* Filter Logic */
  const filtered = proposals.filter((g) => {
    const id = g.Demand_id || g.id || "";
    if (searchId && !id.toLowerCase().includes(searchId.toLowerCase())) return false;
    if (selectedCategory && g.category !== selectedCategory) return false;
    if (selectedStatus && g.status !== selectedStatus) return false;
    if (selectedType && g.request_type !== selectedType) return false;
    return true;
  });

  const totalCount = proposals.length;
  const activeCount = proposals.filter((g) => g.status !== "RESOLVED").length;
  const resolvedCount = proposals.filter((g) => g.status === "RESOLVED").length;

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
              onClick={() => navigate("/feed")}
            >
              ← Back to Dashboard
            </button>

            <div className="portal-title-group">
              <span className="portal-org">SPIN · CITIZEN SERVICES</span>
              <h1 className="portal-heading" style={{ fontSize: "24px" }}>My Submitted Requests</h1>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                Official tracking registry for your public infrastructure demands and proposals.
              </p>
            </div>
          </div>

          <button className="service-card-btn service-card-btn-orange" onClick={() => navigate("/propose")}>
            + Submit New Request
          </button>
        </div>
      </div>

      <div className="container">
        {/* Real Summary Cards (0 for new user, no fake seed numbers) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-3">
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
                <option value="existing_problem">Current Need</option>
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
                {proposals.length === 0 ? "No Demands Submitted Yet" : "No Matching Demands Found"}
              </h3>
              <p className="portal-subtext" style={{ maxWidth: "460px", margin: "0 auto 16px auto" }}>
                {proposals.length === 0
                  ? "You have not submitted any infrastructure demands yet. Once registered, your official tracking status will appear here."
                  : "Try clearing your search query or filter selection to see all demands."}
              </p>
              {proposals.length === 0 && (
                <button
                  type="button"
                  className="service-card-btn service-card-btn-orange"
                  style={{ display: "inline-block" }}
                  onClick={() => navigate("/propose")}
                >
                  + Submit Your First Proposal
                </button>
              )}
            </div>
          ) : (
            filtered.map((g) => {
              const reqId = g.Demand_id || g.id;
              const isNewDev = g.request_type === "new_development";
              return (
                <div key={reqId} className="form-card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span className="mono" style={{ fontSize: "16px", fontWeight: "700", color: "var(--col-navy)" }}>
                          {reqId}
                        </span>
                        <span className={`status-pill ${g.status || "SUBMITTED"}`}>
                          {(g.status || "SUBMITTED").replace(/_/g, " ")}
                        </span>
                        <span style={{
                            fontSize: "11px", padding: "2px 8px", borderRadius: "12px",
                            background: "rgba(71, 85, 105, 0.1)", color: "#475569", fontWeight: 600
                        }}>
                          {g.category || "General"}
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
                          {isNewDev ? "🏗️ New Development" : "⚠️ Current Need"}
                        </span>
                      </div>
                      <strong 
                        style={{ 
                          fontSize: "16px", 
                          color: "var(--col-navy)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: "1.4"
                        }}
                      >
                        {g.english_translation || g.original_text || g.title || "Infrastructure Request"}
                      </strong>
                      <span className="body-sm" style={{ color: "var(--col-text-mid)", marginTop: "2px" }}>
                        📍 {formatLocation(g) || "Location not specified"}
                      </span>
                    </div>

                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                      <span className="body-sm" style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>
                        Submitted: {g.created_at ? new Date(g.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Today"}
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn-outline"
                          style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", borderColor: "rgba(22, 163, 74, 0.3)" }}
                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Support this demand on SPIN: https://niketandoes.me/demand/' + reqId)}`, '_blank')}
                          title="Share on WhatsApp"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                          Share
                        </button>
                        <button
                          className="service-card-btn"
                          style={{ padding: "6px 16px", fontSize: "12px" }}
                          onClick={() => navigate("/demand/" + reqId)}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 600, color: "var(--col-navy)" }}>Support Progress</span>
                      <span style={{ color: "var(--col-text-mid)", fontWeight: 500 }}>
                        {g.vote_count || 0} / 50 votes collected
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          height: "100%", 
                          background: "var(--col-orange)", 
                          width: `${Math.min(((g.vote_count || 0) / 50) * 100, 100)}%`,
                          transition: "width 0.5s ease-out"
                        }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate("/feed")}
          >
            ← Go Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
