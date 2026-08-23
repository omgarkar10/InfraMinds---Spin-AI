import React, { useState } from "react";
import "../../styles/citizen.css";
import { getStoredGrievances } from "../../services/grievanceService";
import type { CitizenUser } from "../../types";

interface TrackGrievancesProps {
  user: CitizenUser;
  onNavigate: (view: string, grievanceId?: string) => void;
}

export const TrackGrievances: React.FC<TrackGrievancesProps> = ({ onNavigate }) => {
  const grievances = getStoredGrievances();
  const [searchId, setSearchId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  /* Filter Logic */
  const filtered = grievances.filter((g) => {
    if (searchId && !g.id.toLowerCase().includes(searchId.toLowerCase())) return false;
    if (selectedCategory && g.category !== selectedCategory) return false;
    if (selectedStatus && g.status !== selectedStatus) return false;
    if (selectedDistrict && g.location.district !== selectedDistrict) return false;
    return true;
  });

  const totalCount = grievances.length;
  const activeCount = grievances.filter((g) => g.status !== "RESOLVED").length;
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length;
  const actionRequiredCount = grievances.filter((g) => g.status === "REOPENED" || g.severity === "Critical").length;

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
                whiteSpace: "nowrap"
              }}
              onClick={() => onNavigate("landing")}
            >
              ← Back to Home
            </button>

            <div className="portal-title-group">
              <span className="portal-org">SPIN · CITIZEN SERVICES</span>
              <h1 className="portal-heading">My Submitted Grievances</h1>
              <p className="portal-subtext">
                Track real-time resolution progress, department routing, and spatial cluster analysis.
              </p>
            </div>
          </div>

          <button className="service-card-btn service-card-btn-orange" onClick={() => onNavigate("citizen-raise")}>
            + Raise New Grievance
          </button>
        </div>
      </div>

      <div className="container">
        {/* Top 4 Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div className="stat-card">
            <span className="stat-label">TOTAL GRIEVANCES</span>
            <span className="stat-value">{totalCount}</span>
          </div>
          <div className="stat-card accent">
            <span className="stat-label">ACTIVE / IN PROGRESS</span>
            <span className="stat-value" style={{ color: "var(--col-orange)" }}>{activeCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">RESOLVED</span>
            <span className="stat-value" style={{ color: "var(--col-green)" }}>{resolvedCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">ACTION REQUIRED</span>
            <span className="stat-value" style={{ color: "var(--col-red)" }}>{actionRequiredCount}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="form-card" style={{ padding: "16px", marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Search Grievance ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by ID (e.g. SPIN-2026-123456)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Roads & Potholes">Roads & Potholes</option>
                <option value="Electricity">Electricity</option>
                <option value="Waste Management">Waste Management</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INSPECTION_SCHEDULED">Inspection Scheduled</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">District</label>
              <select
                className="form-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="">All Districts</option>
                <option value="Pune">Pune</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grievances List / Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.length === 0 ? (
            <div className="form-card" style={{ textAlign: "center", padding: "40px" }}>
              <p className="portal-subtext">No grievances found matching your search criteria.</p>
            </div>
          ) : (
            filtered.map((g) => (
              <div key={g.id} className="form-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="mono" style={{ fontSize: "16px", fontWeight: "700", color: "var(--col-navy)" }}>
                        {g.id}
                      </span>
                      <span className={`status-pill ${g.status}`}>
                        {g.status.replace(/_/g, " ")}
                      </span>
                      {g.aiAnalysis.redZone && (
                        <span className="tag-red" style={{ fontSize: "9px" }}>🔴 RED ZONE CLUSTER</span>
                      )}
                    </div>
                    <strong style={{ fontSize: "16px", color: "var(--col-navy)" }}>{g.category} — {g.issueType}</strong>
                    <span className="body-sm" style={{ color: "var(--col-text-mid)" }}>📍 {g.location.address}, {g.location.district}</span>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                    <span className="body-sm" style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>
                      Submitted: {g.createdAt}
                    </span>
                    <button
                      className="service-card-btn"
                      style={{ padding: "6px 16px", fontSize: "12px" }}
                      onClick={() => onNavigate("citizen-detail", g.id)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>

                <div style={{ background: "var(--col-panel)", padding: "10px 14px", borderRadius: "6px", fontSize: "12px", color: "var(--col-text-mid)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <span><strong>Assigned Department:</strong> {g.department}</span>
                  <span><strong>Severity:</strong> <span style={{ color: "var(--col-red)", fontWeight: "600" }}>{g.severity}</span></span>
                  <span><strong>Nearby Grievances:</strong> {g.aiAnalysis.nearbyGrievances} signals</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
