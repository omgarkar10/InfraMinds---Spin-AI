import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { getStoredGrievances, updateStaffDecision, updateGrievanceStatus } from "../../services/grievanceService";
import type { StaffUser, Grievance, GrievanceStatus, GrievanceCategory } from "../../types";
import { GrievanceKPIBar } from "./GrievanceKPIBar";

// All grievance categories — matches types/index.ts GrievanceCategory
const ALL_CATEGORIES: GrievanceCategory[] = [
  "Water Supply",
  "Roads & Potholes",
  "Drainage / Flooding",
  "Electricity",
  "Waste Management",
  "Street Lighting",
  "Public Transport",
  "Sanitation",
  "Public Infrastructure",
  "Other",
];

interface StaffDashboardProps {
  user: StaffUser;
  onNavigate: (view: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onNavigate }) => {
  const [grievances, setGrievances] = useState<Grievance[]>(getStaffGrievances(user));
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [staffNote, setStaffNote] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  useEffect(() => {
    // Whenever logged in user changes, reload department-scoped grievances
    refreshData();
  }, [user.id, user.department, user.role]);

  const refreshData = () => {
    const list = getStaffGrievances(user);
    setGrievances(list);
    if (selectedGrievance) {
      const authorized = getStaffGrievanceById(selectedGrievance.id, user);
      if (authorized) {
        setSelectedGrievance(authorized);
      } else {
        setSelectedGrievance(null);
      }
    }
  };

  const handleOpenDossier = (g: Grievance) => {
    const authorized = getStaffGrievanceById(g.id, user);
    if (authorized) {
      setSelectedGrievance(authorized);
      setAuthError("");
    } else {
      setAuthError(`Access Denied: Grievance ${g.id} belongs to a different department.`);
    }
  };

  const handleDecision = (decision: "ACCEPTED" | "MODIFIED" | "REJECTED") => {
    if (!selectedGrievance) return;
    const authorized = getStaffGrievanceById(selectedGrievance.id, user);
    if (!authorized) {
      setAuthError("Access Denied: Unauthorized modification attempt.");
      setSelectedGrievance(null);
      return;
    }
    updateStaffDecision(selectedGrievance.id, decision, staffNote || `Officer ${decision.toLowerCase()} recommendation.`);
    setStaffNote("");
    refreshData();
  };

  const handleStatusChange = (newStatus: GrievanceStatus) => {
    if (!selectedGrievance) return;
    const authorized = getStaffGrievanceById(selectedGrievance.id, user);
    if (!authorized) {
      setAuthError("Access Denied: Unauthorized status change attempt.");
      setSelectedGrievance(null);
      return;
    }
    updateGrievanceStatus(selectedGrievance.id, newStatus, staffNote || `Officer changed status to ${newStatus}.`);
    setStaffNote("");
    refreshData();
  };

  const filteredGrievances = grievances.filter((g) => {
    if (statusFilter && g.status !== statusFilter) return false;
    if (categoryFilter && g.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = g.id.toLowerCase().includes(q);
      const matchDesc = g.description.toLowerCase().includes(q);
      const matchLoc = (g.location.address || "").toLowerCase().includes(q) || (g.location.district || "").toLowerCase().includes(q);
      if (!matchId && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  // Derive red zone from actual data — most-affected category/location
  const highSeverityGrievances = grievances.filter(
    (g) => g.severity === "Critical" || g.severity === "High"
  );
  const topRedZoneGrievance = highSeverityGrievances[0] || null;

  // Extract unique categories present in department queue for filter
  const uniqueCategories = Array.from(new Set(grievances.map((g) => g.category)));

  return (
    <div className="citizen-portal-container">
      {/* Top Staff Header */}
      <div className="portal-header-bar" style={{ background: "var(--col-header-bg)", color: "#fff" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="portal-org" style={{ color: "var(--col-orange)" }}>SPIN STAFF PORTAL</span>
                <span className="user-badge-dot" />
                <span style={{ fontSize: "11px", color: "#4ADE80", letterSpacing: "0.1em" }}>SYSTEM OPERATIONAL</span>
              </div>
              <h1 className="portal-heading" style={{ color: "#fff", fontSize: "22px" }}>
                Department Operations & Grievance Queue
              </h1>
              <p className="portal-subtext" style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                Officer: <strong>{user.name}</strong> · Dept: <strong>{user.department}</strong> · Role: <strong>{user.role}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              className="btn-outline"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: "12px" }}
              onClick={() => onNavigate("dashboard")}
            >
              Open Policymaker Map →
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* LIVE GRIEVANCE KPI BAR — all values from actual data */}
        <GrievanceKPIBar grievances={grievances} />

        {/* KPI Overview Cards — dynamically computed */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
          <div className="stat-card">
            <span className="stat-label">ACTIVE GRIEVANCES</span>
            <span className="stat-value">{grievances.filter((g) => g.status !== "RESOLVED").length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">CRITICAL ISSUES</span>
            <span className="stat-value" style={{ color: "var(--col-red)" }}>
              {grievances.filter((g) => g.severity === "Critical" || g.severity === "High").length}
            </span>
          </div>
          <div className="stat-card accent">
            <span className="stat-label">PENDING REVIEW</span>
            <span className="stat-value" style={{ color: "var(--col-orange)" }}>
              {grievances.filter((g) => g.decisionStatus === "PENDING" || !g.decisionStatus).length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">RESOLVED</span>
            <span className="stat-value" style={{ color: "var(--col-green)" }}>
              {grievances.filter((g) => g.status === "RESOLVED").length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">ESCALATED / REOPENED</span>
            <span className="stat-value" style={{ color: "var(--col-amber)" }}>
              {grievances.filter((g) => g.status === "REOPENED").length}
            </span>
          </div>
        </div>

        {/* RED ZONE ALERT — dynamically from highest-severity grievance */}
        {topRedZoneGrievance ? (
          <div className="process-flow-box" style={{ borderLeft: "4px solid var(--col-red)", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="tag-red" style={{ fontSize: "10px" }}>🔴 RED ZONE ALERT DETECTED</span>
                <strong style={{ color: "var(--col-navy)", fontSize: "15px" }}>
                  {topRedZoneGrievance.location.district.toUpperCase()} — {topRedZoneGrievance.category.toUpperCase()}
                </strong>
              </div>
              <button className="btn-outline btn-outline-orange" style={{ fontSize: "11px" }} onClick={() => onNavigate("dashboard")}>
                View Spatial Intelligence Map →
              </button>
            </div>
            <p className="body-sm" style={{ marginTop: "6px", color: "var(--col-text-mid)" }}>
              Severity: <strong>{topRedZoneGrievance.severity}</strong> · Location: {topRedZoneGrievance.location.address || topRedZoneGrievance.location.district} · Status: {topRedZoneGrievance.status.replace(/_/g, " ")}
            </p>
          </div>
        ) : grievances.length === 0 ? (
          <div className="process-flow-box" style={{ borderLeft: "4px solid var(--col-green)", marginBottom: "24px" }}>
            <p className="body-sm" style={{ color: "var(--col-text-mid)" }}>
              ✅ No active grievances submitted yet. Red zone alerts will appear here when citizens submit complaints.
            </p>
          </div>
        ) : null}

        {/* Filter Controls & Grievance Queue Table */}
        <div className="form-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span className="label-eyebrow">DEPARTMENT QUEUE</span>
              <h2 className="portal-heading" style={{ fontSize: "18px" }}>
                {user.department} Queue ({filteredGrievances.length})
              </h2>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="">All Categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "180px" }}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INSPECTION_SCHEDULED">Inspection Scheduled</option>
                <option value="ACTION_TAKEN">Action Taken</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REOPENED">Reopened</option>
              </select>
            </div>
          </div>

          {filteredGrievances.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--col-text-muted)", background: "var(--col-panel)", borderRadius: "8px" }}>
              <p style={{ fontSize: "14px" }}>No grievances match the selected filters.</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>Citizens can submit grievances through the Citizen Portal.</p>
            </div>
          ) : (
            <table className="staff-table">
              <thead>
                <tr>
                  <th>GRIEVANCE ID</th>
                  <th>CATEGORY</th>
                  <th>LOCATION</th>
                  <th>SEVERITY</th>
                  <th>SUBMITTED</th>
                  <th>STATUS</th>
                  <th>ASSIGNED TO</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrievances.map((g) => (
                  <tr key={g.id}>
                    <td className="mono" style={{ fontWeight: "700" }}>{g.id}</td>
                    <td>{g.category}</td>
                    <td>{g.location.district} ({g.location.address})</td>
                    <td>
                      <span style={{
                        color: g.severity === "Critical" ? "var(--col-red)"
                          : g.severity === "High" ? "var(--col-orange)"
                          : "inherit",
                        fontWeight: "700"
                      }}>
                        {g.severity}
                      </span>
                    </td>
                    <td>{g.createdAt}</td>
                    <td><span className={`status-pill ${g.status}`}>{g.status.replace(/_/g, " ")}</span></td>
                    <td>{g.assignedTo}</td>
                    <td>
                      <button
                        className="service-card-btn"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                        onClick={() => setSelectedGrievance(g)}
                      >
                        Open Dossier →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* STAFF DETAIL MODAL / DRAWER */}
      {selectedGrievance && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,30,54,0.6)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", borderTop: "4px solid var(--col-navy)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="label-eyebrow">STAFF REVIEW DOSSIER</span>
                <h2 className="portal-heading" style={{ fontSize: "22px" }}>{selectedGrievance.id}</h2>
                <p className="portal-subtext" style={{ fontSize: "14px", color: "var(--col-navy)" }}>
                  {selectedGrievance.category} — {selectedGrievance.issueType} ({selectedGrievance.location.district}, {selectedGrievance.location.state})
                </p>
              </div>
              <button className="btn-outline" style={{ padding: "4px 10px" }} onClick={() => setSelectedGrievance(null)}>
                ✕ Close
              </button>
            </div>

            {/* Complaint Details */}
            <div className="ai-review-card">
              <span className="label-eyebrow">CITIZEN COMPLAINT & EVIDENCE</span>
              <p className="body-md" style={{ color: "var(--col-navy)" }}>"{selectedGrievance.description}"</p>
              <div style={{ fontSize: "12px", color: "var(--col-text-mid)", marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span><strong>Category:</strong> {selectedGrievance.category}</span>
                <span><strong>Issue Type:</strong> {selectedGrievance.issueType}</span>
                <span><strong>Address:</strong> {selectedGrievance.location.address || selectedGrievance.location.district}</span>
                <span><strong>District:</strong> {selectedGrievance.location.district} · <strong>State:</strong> {selectedGrievance.location.state}</span>
                <span><strong>Severity:</strong> {selectedGrievance.severity} · <strong>Frequency:</strong> {selectedGrievance.frequency}</span>
                <span><strong>Started:</strong> {selectedGrievance.startDate}</span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="process-flow-box" style={{ background: "var(--col-orange-dim)", border: "1px solid var(--col-orange-line)", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="label-orange">SPIN AI RECOMMENDATION</span>
                <span className="location-status-badge verified">
                  CONFIDENCE {selectedGrievance.aiAnalysis?.confidence || 85}%
                </span>
              </div>

              <h4 style={{ fontSize: "16px", color: "var(--col-navy)", margin: "6px 0" }}>
                "{selectedGrievance.aiAnalysis?.reasoning || `Prioritize field inspection for ${selectedGrievance.category} issue in ${selectedGrievance.location.district}.`}"
              </h4>

              <div style={{ background: "var(--col-surface)", padding: "12px", borderRadius: "6px", fontSize: "12px", margin: "8px 0" }}>
                <strong>EVIDENCE:</strong>
                <ul style={{ listStyle: "none", paddingLeft: "4px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <li>• Category: {selectedGrievance.category} in {selectedGrievance.location.district}</li>
                  {selectedGrievance.aiAnalysis?.nearbyGrievances > 0 && (
                    <li>• {selectedGrievance.aiAnalysis.nearbyGrievances} related grievances in cluster</li>
                  )}
                  <li>• Severity: {selectedGrievance.severity} ({selectedGrievance.aiAnalysis?.redZone ? "Red Zone" : "Standard Zone"})</li>
                  <li>• Frequency: {selectedGrievance.frequency}</li>
                </ul>
              </div>

              <div style={{ background: "var(--col-navy)", color: "#fff", padding: "10px 14px", borderRadius: "6px", marginTop: "12px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🛡️ AI RECOMMENDATION — HUMAN APPROVAL REQUIRED</span>
                <span style={{ color: "var(--col-orange)" }}>STATUS: {selectedGrievance.decisionStatus || "PENDING"}</span>
              </div>
            </div>

            {/* Officer Note & Actions */}
            <div className="form-group">
              <label className="form-label">Officer Inspection Notes / Remarks</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                placeholder="Enter official departmental instructions or inspection findings..."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="service-card-btn service-card-btn-orange" onClick={() => handleDecision("ACCEPTED")}>
                  ✓ Accept Recommendation
                </button>
                <button className="btn-outline" onClick={() => handleDecision("MODIFIED")}>
                  ✏️ Modify
                </button>
                <button className="btn-outline" style={{ color: "var(--col-red)", borderColor: "rgba(220,38,38,0.3)" }} onClick={() => handleDecision("REJECTED")}>
                  ✕ Reject
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="body-sm" style={{ fontSize: "11px" }}>Update Status:</span>
                <select
                  className="form-select"
                  style={{ width: "180px", padding: "6px" }}
                  value={selectedGrievance.status}
                  onChange={(e) => handleStatusChange(e.target.value as GrievanceStatus)}
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="INSPECTION_SCHEDULED">Inspection Scheduled</option>
                  <option value="ACTION_TAKEN">Action Taken</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
