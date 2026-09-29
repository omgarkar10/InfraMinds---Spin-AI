import React, { useState } from "react";
import type { StaffUser, Proposal, DemandStatus } from "../../types";
import { updateStaffDecision, updateDemandStatus } from "../../services/demandService";
import { DemandKPIBar } from "./DemandKPIBar";

interface DepartmentOfficerDashboardProps {
  user: StaffUser;
  demands: Proposal[];
  onRefresh: () => void;
}

export const DepartmentOfficerDashboard: React.FC<DepartmentOfficerDashboardProps> = ({ user: _user, demands, onRefresh }) => {
  const [selectedDemand, setSelectedDemand] = useState<Proposal | null>(null);
  const [viewMode, setViewMode] = useState<"queue" | "review" | "dispatch">("queue");
  const [staffNote, setStaffNote] = useState("");
  const [authError, setAuthError] = useState("");

  const handleDecision = (decision: "ACCEPTED" | "MODIFIED" | "REJECTED") => {
    if (!selectedDemand) return;
    updateStaffDecision(selectedDemand.id, decision, staffNote || `Officer ${decision.toLowerCase()} recommendation.`);
    setStaffNote("");
    onRefresh();
    setViewMode("queue");
  };

  const handleStatusChange = (newStatus: DemandStatus) => {
    if (!selectedDemand) return;
    updateDemandStatus(selectedDemand.id, newStatus, staffNote || `Officer changed status to ${newStatus}.`);
    setStaffNote("");
    onRefresh();
    setViewMode("queue");
  };

  const handleAssignFieldOfficer = (officerName: string) => {
    if (!selectedDemand) return;
    // Mock assignment
    updateDemandStatus(selectedDemand.id, "FEASIBILITY_STUDY", `Assigned to ${officerName} for site inspection.`);
    onRefresh();
    setViewMode("queue");
  };

  const activeDemands = demands.filter(d => d.status === "GATHERING_SUPPORT" || d.status === "PENDING");
  const underReviewDemands = demands.filter(d => d.status === "FEASIBILITY_STUDY");

  return (
    <div style={{ paddingTop: "20px" }}>
      {authError && (
        <div style={{ background: "#ffe6e6", border: "1px solid red", color: "red", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🚫 {authError}</span>
          <button style={{ border: "none", background: "transparent", color: "red", cursor: "pointer", fontWeight: "bold" }} onClick={() => setAuthError("")}>✕</button>
        </div>
      )}

      {viewMode === "queue" && (
        <>
          <DemandKPIBar proposals={demands} isLiveApi={true} />
          
          <div className="panel" style={{ marginTop: "24px" }}>
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="panel-title">Threshold Trigger Queue</h2>
              <span className="panel-badge" style={{ background: "var(--col-red)", color: "#fff" }}>{activeDemands.length} Requires Action</span>
            </div>
            
            <div className="table-responsive">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Demand ID</th>
                    <th>Category</th>
                    <th>Location / Zone</th>
                    <th>Votes</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDemands.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                        <div style={{ fontSize: "24px", marginBottom: "10px" }}>📥</div>
                        <div style={{ fontWeight: 600, color: "var(--col-navy)" }}>No Pending Demands</div>
                        <div style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>All demands that reached the threshold have been dispatched.</div>
                      </td>
                    </tr>
                  ) : (
                    activeDemands.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600, color: "var(--col-navy)" }}>{d.id}</td>
                        <td>{d.category}</td>
                        <td>{d.location.district || "General Area"}</td>
                        <td><span style={{ background: "#e0f2fe", color: "var(--col-blue)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>{d.upvotes} Votes</span></td>
                        <td>
                          <span className={`status-badge status-${d.status.toLowerCase()}`}>
                            {d.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-outline" 
                            style={{ padding: "4px 12px", fontSize: "11px", borderColor: "var(--col-navy)", color: "var(--col-navy)" }}
                            onClick={() => { setSelectedDemand(d); setViewMode("dispatch"); }}
                          >
                            Dispatch Field Officer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel" style={{ marginTop: "24px" }}>
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="panel-title">Report Review Workspace</h2>
              <span className="panel-badge" style={{ background: "var(--col-orange)", color: "#fff" }}>{underReviewDemands.length} In Progress</span>
            </div>
            <div className="table-responsive">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Demand ID</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {underReviewDemands.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--col-text-muted)" }}>No active feasibility studies.</td>
                    </tr>
                  ) : (
                    underReviewDemands.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600, color: "var(--col-navy)" }}>{d.id}</td>
                        <td><span style={{ fontSize: "12px", color: "#666" }}>Field Officer (Auto)</span></td>
                        <td><span className={`status-badge status-progress`}>FEASIBILITY STUDY</span></td>
                        <td>
                          <button 
                            className="btn-outline" 
                            style={{ padding: "4px 12px", fontSize: "11px", borderColor: "var(--col-orange)", color: "var(--col-orange)" }}
                            onClick={() => { setSelectedDemand(d); setViewMode("review"); }}
                          >
                            Review & Decide
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DISPATCH BOARD MODAL/VIEW */}
      {viewMode === "dispatch" && selectedDemand && (
        <div className="panel" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="label-eyebrow">FIELD OFFICER DISPATCH BOARD</span>
              <h2 className="panel-title" style={{ fontSize: "20px" }}>Assign Feasibility Survey for {selectedDemand.id}</h2>
            </div>
            <button onClick={() => setViewMode("queue")} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--col-text-muted)" }}>×</button>
          </div>
          <div style={{ padding: "20px" }}>
            <div className="dashboard-grid" style={{ marginBottom: "20px" }}>
              <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--col-text-muted)", textTransform: "uppercase" }}>Demand Details</h4>
                <div style={{ fontWeight: 600, fontSize: "16px", color: "var(--col-navy)", marginBottom: "8px" }}>{selectedDemand.description}</div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>📍 {selectedDemand.location.address || selectedDemand.location.district}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>🗳️ {selectedDemand.upvotes} Community Votes</div>
              </div>
              <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--col-text-muted)", textTransform: "uppercase" }}>Available Officers (Zone)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button onClick={() => handleAssignFieldOfficer("Officer Sharma")} className="btn-outline" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", textAlign: "left", width: "100%" }}>
                    <span>Officer Sharma (Zone A)</span>
                    <span style={{ fontSize: "11px", color: "var(--col-green)" }}>Available</span>
                  </button>
                  <button onClick={() => handleAssignFieldOfficer("Officer Verma")} className="btn-outline" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", textAlign: "left", width: "100%" }}>
                    <span>Officer Verma (Zone B)</span>
                    <span style={{ fontSize: "11px", color: "var(--col-orange)" }}>1 Active Task</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT REVIEW WORKSPACE (SPLIT SCREEN) */}
      {viewMode === "review" && selectedDemand && (
        <div>
          <button 
            onClick={() => setViewMode("queue")}
            style={{ background: "none", border: "none", color: "var(--col-navy)", fontSize: "14px", padding: "0 0 20px 0", cursor: "pointer", fontWeight: 600 }}
          >
            ← Back to Queue
          </button>
          
          <div className="dashboard-grid">
            
            {/* Left: Original Demand */}
            <div className="panel">
              <div className="panel-header">
                <span className="label-eyebrow">ORIGINAL CITIZEN DEMAND</span>
                <h2 className="panel-title">{selectedDemand.id}</h2>
              </div>
              <div style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "18px", color: "var(--col-navy)", marginTop: 0 }}>{selectedDemand.description}</h3>
                <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
                  <strong>Category:</strong> {selectedDemand.category} <br/>
                  <strong>Location:</strong> {selectedDemand.location.address || selectedDemand.location.district} <br/>
                  <strong>Submitted:</strong> {new Date(selectedDemand.created_at || selectedDemand.createdAt || Date.now()).toLocaleDateString()} <br/>
                  <strong>Community Votes:</strong> {selectedDemand.upvotes}
                </p>
              </div>
            </div>

            {/* Right: Feasibility Report */}
            <div className="panel">
              <div className="panel-header" style={{ background: "rgba(232, 89, 12, 0.05)", borderBottom: "1px solid rgba(232, 89, 12, 0.2)" }}>
                <span className="label-eyebrow" style={{ color: "var(--col-orange)" }}>FIELD OFFICER REPORT</span>
                <h2 className="panel-title">Geotagged Feasibility Study</h2>
              </div>
              <div style={{ padding: "20px" }}>
                <div style={{ background: "#f8f9fa", border: "1px dashed #ccc", padding: "30px", textAlign: "center", borderRadius: "8px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>📸</div>
                  <div style={{ fontSize: "13px", color: "#666" }}>[Geotagged Photo Evidence]</div>
                  <div style={{ fontSize: "11px", color: "var(--col-green)", marginTop: "5px" }}>EXIF GPS Match: Verified (99.8%)</div>
                </div>
                
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "var(--col-navy)" }}>Rapid Assessment Checklist</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", fontSize: "13px", color: "#444", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li>✅ Clear Physical Access to Site</li>
                  <li>✅ No Immediate Legal/Zoning Blockers</li>
                  <li>❌ Site Requires Safety Clearing First</li>
                  <li><strong>Effort:</strong> Medium (1-4 weeks)</li>
                </ul>

                {/* Decision Action Bar */}
                <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--col-navy)", marginBottom: "8px" }}>Department Officer Note (Internal)</label>
                  <textarea 
                    value={staffNote}
                    onChange={e => setStaffNote(e.target.value)}
                    className="form-input"
                    placeholder="Enter justification for policymaker review..."
                    style={{ width: "100%", height: "80px", marginBottom: "16px", resize: "none" }}
                  />
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                      onClick={() => handleStatusChange("APPROVED_FOR_BUDGET")} 
                      className="service-card-btn" 
                      style={{ flex: 1, background: "var(--col-green)", justifyContent: "center", padding: "12px" }}
                    >
                      ✓ Approve to Policymaker
                    </button>
                    <button 
                      onClick={() => handleDecision("REJECTED")} 
                      className="service-card-btn" 
                      style={{ flex: 1, background: "var(--col-red)", justifyContent: "center", padding: "12px" }}
                    >
                      ✕ Reject Demand
                    </button>
                  </div>
                  <button 
                    onClick={() => handleAssignFieldOfficer("Officer Sharma (Re-inspect)")} 
                    className="btn-outline" 
                    style={{ width: "100%", marginTop: "10px", padding: "10px", borderColor: "var(--col-border)" }}
                  >
                    Request Re-inspection
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
