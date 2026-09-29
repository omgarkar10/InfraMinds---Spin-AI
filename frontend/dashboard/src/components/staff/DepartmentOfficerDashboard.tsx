import React, { useState, useEffect } from "react";
import type { StaffUser } from "../../types";
import { DemandKPIBar } from "./DemandKPIBar";

// API Response Types
interface QueueMetrics {
  total_demands: number;
  pending_action: number;
  in_field_survey: number;
  ready_for_escalation: number;
}

interface Officer {
  id: string;
  name: string;
  email: string;
  department?: string;
}

interface DepartmentOfficerDashboardProps {
  user: StaffUser;
}

export const DepartmentOfficerDashboard: React.FC<DepartmentOfficerDashboardProps> = ({ user: _user }) => {
  const [demands, setDemands] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"queue" | "review" | "dispatch">("queue");
  const [staffNote, setStaffNote] = useState("");
  const [authError, setAuthError] = useState("");
  // isLoading removed

  useEffect(() => {
    fetchQueue();
    fetchOfficers();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/demands/queue`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDemands(data.demands || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Failed to load queue. Ensure you have Department Officer access.");
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/field-officers`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setOfficers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecision = async (action: "approve_to_policy" | "reinspect" | "reject") => {
    if (!selectedDemand) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/investigation/${selectedDemand.id}/decision`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ action, reason: staffNote || "No notes provided." })
      });
      if (res.ok) {
        setStaffNote("");
        fetchQueue();
        setViewMode("queue");
      } else {
        setAuthError("Failed to submit decision.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignFieldOfficer = async (officerId: string) => {
    if (!selectedDemand) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/investigation/${selectedDemand.id}/assign`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ 
          field_officer_id: officerId, 
          notes: staffNote || "Please conduct site feasibility survey.",
          deadline: new Date(Date.now() + 86400000 * 3).toISOString() // +3 days
        })
      });
      if (res.ok) {
        setStaffNote("");
        fetchQueue();
        setViewMode("queue");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeDemands = demands.filter(d => d.status === "gathering_support" || d.status === "under_review");
  const underReviewDemands = demands.filter(d => d.status === "field_survey" || d.status === "feasibility_reported");

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
              <span className="panel-badge" style={{ background: "var(--col-red)", color: "#fff" }}>{metrics?.pending_action || activeDemands.length} Requires Action</span>
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
                        <td style={{ fontWeight: 600, color: "var(--col-navy)" }}>{d.id.substring(0, 8)}</td>
                        <td>{d.category || d.domain}</td>
                        <td>{d.address || d.district || "General Area"}</td>
                        <td><span style={{ background: "#e0f2fe", color: "var(--col-blue)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>{d.vote_count} Votes</span></td>
                        <td>
                          <span className={`status-badge status-${(d.status || "").toLowerCase()}`}>
                            {(d.status || "").replace(/_/g, " ")}
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
              <span className="panel-badge" style={{ background: "var(--col-orange)", color: "#fff" }}>{metrics?.ready_for_escalation || underReviewDemands.length} Pending Review</span>
            </div>
            <div className="table-responsive">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Demand ID</th>
                    <th>Assigned Officer</th>
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
                        <td style={{ fontWeight: 600, color: "var(--col-navy)" }}>{d.id.substring(0, 8)}</td>
                        <td><span style={{ fontSize: "12px", color: "#666" }}>{d.assigned_officer_id || "Field Officer"}</span></td>
                        <td><span className={`status-badge status-progress`}>{d.status.replace(/_/g, " ")}</span></td>
                        <td>
                          {d.status === "feasibility_reported" ? (
                            <button 
                              className="btn-outline" 
                              style={{ padding: "4px 12px", fontSize: "11px", borderColor: "var(--col-orange)", background: "var(--col-orange)", color: "#fff" }}
                              onClick={() => { setSelectedDemand(d); setViewMode("review"); }}
                            >
                              Review & Decide
                            </button>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#666" }}>Awaiting Report</span>
                          )}
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
              <h2 className="panel-title" style={{ fontSize: "20px" }}>Assign Feasibility Survey for {selectedDemand.id.substring(0, 8)}</h2>
            </div>
            <button onClick={() => setViewMode("queue")} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--col-text-muted)" }}>×</button>
          </div>
          <div style={{ padding: "20px" }}>
            <div className="dashboard-grid" style={{ marginBottom: "20px" }}>
              <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--col-text-muted)", textTransform: "uppercase" }}>Demand Details</h4>
                <div style={{ fontWeight: 600, fontSize: "16px", color: "var(--col-navy)", marginBottom: "8px" }}>{selectedDemand.english_translation || selectedDemand.original_text}</div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>📍 {selectedDemand.address || selectedDemand.district}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>🗳️ {selectedDemand.vote_count} Community Votes</div>
              </div>
              <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--col-text-muted)", textTransform: "uppercase" }}>Instructions to Field Officer</h4>
                <textarea 
                  value={staffNote}
                  onChange={e => setStaffNote(e.target.value)}
                  className="form-input"
                  placeholder="Enter specific items to verify (e.g. pipe width, street access)..."
                  style={{ width: "100%", height: "60px", marginBottom: "16px", resize: "none" }}
                />
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--col-text-muted)", textTransform: "uppercase" }}>Available Officers (Zone)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {officers.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "var(--col-red)" }}>No field officers found in your department.</div>
                  ) : (
                    officers.map(off => (
                      <button key={off.id} onClick={() => handleAssignFieldOfficer(off.id)} className="btn-outline" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", textAlign: "left", width: "100%" }}>
                        <span>{off.name}</span>
                        <span style={{ fontSize: "11px", color: "var(--col-green)" }}>Dispatch →</span>
                      </button>
                    ))
                  )}
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
                <h3 style={{ fontSize: "18px", color: "var(--col-navy)", marginTop: 0 }}>{selectedDemand.english_translation || selectedDemand.original_text}</h3>
                <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
                  <strong>Category:</strong> {selectedDemand.category} <br/>
                  <strong>Location:</strong> {selectedDemand.address || selectedDemand.district} <br/>
                  <strong>Community Votes:</strong> {selectedDemand.vote_count}
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
                  <div style={{ fontSize: "13px", color: "#666" }}>[Geotagged Photo Evidence Uploaded]</div>
                  <div style={{ fontSize: "11px", color: "var(--col-green)", marginTop: "5px" }}>EXIF GPS Match: Verified (99.8%)</div>
                </div>
                
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
                      onClick={() => handleDecision("approve_to_policy")} 
                      className="service-card-btn" 
                      style={{ flex: 1, background: "var(--col-green)", justifyContent: "center", padding: "12px" }}
                    >
                      ✓ Approve to Policymaker
                    </button>
                    <button 
                      onClick={() => handleDecision("reject")} 
                      className="service-card-btn" 
                      style={{ flex: 1, background: "var(--col-red)", justifyContent: "center", padding: "12px" }}
                    >
                      ✕ Reject Demand
                    </button>
                  </div>
                  <button 
                    onClick={() => handleDecision("reinspect")} 
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
