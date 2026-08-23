import React, { useState } from "react";
import "../../styles/citizen.css";
import { getStoredGrievances, updateStaffDecision, updateGrievanceStatus } from "../../services/grievanceService";
import type { StaffUser, Grievance, GrievanceStatus } from "../../types";

import { GrievanceKPIBar } from "./GrievanceKPIBar";

interface StaffDashboardProps {
  user: StaffUser;
  onNavigate: (view: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onNavigate }) => {
  const [grievances, setGrievances] = useState<Grievance[]>(getStoredGrievances());
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [staffNote, setStaffNote] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const refreshData = () => {
    const list = getStoredGrievances();
    setGrievances(list);
    if (selectedGrievance) {
      const updated = list.find((g) => g.id === selectedGrievance.id);
      if (updated) setSelectedGrievance(updated);
    }
  };

  const handleDecision = (decision: "ACCEPTED" | "MODIFIED" | "REJECTED") => {
    if (!selectedGrievance) return;
    updateStaffDecision(selectedGrievance.id, decision, staffNote || `Officer ${decision.toLowerCase()} recommendation.`);
    setStaffNote("");
    refreshData();
  };

  const handleStatusChange = (newStatus: GrievanceStatus) => {
    if (!selectedGrievance) return;
    updateGrievanceStatus(selectedGrievance.id, newStatus, staffNote || `Officer changed status to ${newStatus}.`);
    setStaffNote("");
    refreshData();
  };

  const filteredGrievances = grievances.filter((g) => {
    if (statusFilter && g.status !== statusFilter) return false;
    if (categoryFilter && g.category !== categoryFilter) return false;
    return true;
  });

  const activeCount = grievances.filter((g) => g.status !== "RESOLVED").length;
  const criticalCount = grievances.filter((g) => g.severity === "Critical" || g.severity === "High").length;
  const pendingCount = grievances.filter((g) => g.decisionStatus === "PENDING" || !g.decisionStatus).length;
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length;
  const escalatedCount = grievances.filter((g) => g.status === "REOPENED").length;

  return (
    <div className="citizen-portal-container">
      {/* Top Staff Header */}
      <div className="portal-header-bar" style={{ background: "var(--col-header-bg)", color: "#fff" }}>
        <div className="container portal-header-inner">
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
              Officer: <strong>{user.name}</strong> ({user.employeeId}) · Dept: <strong>{user.department}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }} onClick={() => onNavigate("dashboard")}>
              Open Policymaker Map →
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* NEW GRIEVANCE KPI BAR */}
        <GrievanceKPIBar grievances={grievances} />

        {/* KPI Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
          <div className="stat-card">
            <span className="stat-label">ACTIVE GRIEVANCES</span>
            <span className="stat-value">{activeCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">CRITICAL ISSUES</span>
            <span className="stat-value" style={{ color: "var(--col-red)" }}>{criticalCount}</span>
          </div>
          <div className="stat-card accent">
            <span className="stat-label">PENDING REVIEW</span>
            <span className="stat-value" style={{ color: "var(--col-orange)" }}>{pendingCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">RESOLVED</span>
            <span className="stat-value" style={{ color: "var(--col-green)" }}>{resolvedCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">ESCALATED / REOPENED</span>
            <span className="stat-value" style={{ color: "var(--col-amber)" }}>{escalatedCount}</span>
          </div>
        </div>

        {/* RED ZONE ALERTS PANEL */}
        <div className="process-flow-box" style={{ borderLeft: "4px solid var(--col-red)", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="tag-red" style={{ fontSize: "10px" }}>🔴 RED ZONE ALERT DETECTED</span>
              <strong style={{ color: "var(--col-navy)", fontSize: "15px" }}>PUNE EAST — WATER SUPPLY NETWORK GAP</strong>
            </div>
            <button className="btn-outline btn-outline-orange" style={{ fontSize: "11px" }} onClick={() => onNavigate("dashboard")}>
              View Spatial Intelligence Map →
            </button>
          </div>

          <p className="body-sm" style={{ marginTop: "6px", color: "var(--col-text-mid)" }}>
            High grievance density (37 complaints, 12 km² cluster) + High severity (8.5/10) + Infrastructure response gap detected on Main Segment W-402.
          </p>
        </div>

        {/* Filter Controls & Grievance Queue Table */}
        <div className="form-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <span className="label-eyebrow">DEPARTMENT QUEUE</span>
              <h2 className="portal-heading" style={{ fontSize: "18px" }}>Grievance Processing Queue</h2>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: "160px" }}>
                <option value="">All Categories</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Roads & Potholes">Roads & Potholes</option>
                <option value="Electricity">Electricity</option>
              </select>

              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "160px" }}>
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INSPECTION_SCHEDULED">Inspection Scheduled</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

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
                  <td><span style={{ color: "var(--col-red)", fontWeight: "700" }}>{g.severity}</span></td>
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
                  {selectedGrievance.category} — {selectedGrievance.issueType} ({selectedGrievance.location.district})
                </p>
              </div>

              <button className="btn-outline" style={{ padding: "4px 10px" }} onClick={() => setSelectedGrievance(null)}>
                ✕ Close
              </button>
            </div>

            {/* Citizen Complaint & Evidence Breakdown */}
            <div className="ai-review-card">
              <span className="label-eyebrow">CITIZEN COMPLAINT & EVIDENCE</span>
              <p className="body-md" style={{ color: "var(--col-navy)" }}>"{selectedGrievance.description}"</p>
              <div style={{ fontSize: "12px", color: "var(--col-text-mid)" }}>
                <strong>Complainant:</strong> Citizen (Identity Protected)
                <br />
                <strong>Address:</strong> {selectedGrievance.location.address || selectedGrievance.location.district}
              </div>
            </div>

            {/* AI RECOMMENDATION BOX */}
            <div className="process-flow-box" style={{ background: "var(--col-orange-dim)", border: "1px solid var(--col-orange-line)", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="label-orange">SPIN AI RECOMMENDATION</span>
                <span className="location-status-badge verified">CONFIDENCE 94%</span>
              </div>

              <h4 style={{ fontSize: "16px", color: "var(--col-navy)", margin: "6px 0" }}>
                "Prioritize field inspection and main pipeline assessment in Sector 4 Zone X."
              </h4>

              <div style={{ background: "var(--col-surface)", padding: "12px", borderRadius: "6px", fontSize: "12px", margin: "8px 0" }}>
                <strong>EMPIRICAL EVIDENCE BACKBONE (WHY?):</strong>
                <ul style={{ listStyle: "none", paddingLeft: "4px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <li>• 37 related water grievances in 12 km² cluster</li>
                  <li>• 3-week persistence duration</li>
                  <li>• High severity score (8.5 / 10)</li>
                  <li>• Nearby public school & 14,000 residents impacted</li>
                  <li>• No recent municipal resolution recorded</li>
                </ul>
              </div>

              {/* HUMAN APPROVAL REQUIRED BANNER */}
              <div style={{ background: "var(--col-navy)", color: "#fff", padding: "10px 14px", borderRadius: "6px", marginTop: "12px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🛡️ AI RECOMMENDATION — HUMAN APPROVAL REQUIRED</span>
                <span style={{ color: "var(--col-orange)" }}>STATUS: {selectedGrievance.decisionStatus || "PENDING"}</span>
              </div>
            </div>

            {/* Officer Note & Action Buttons */}
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
                  style={{ width: "160px", padding: "6px" }}
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
