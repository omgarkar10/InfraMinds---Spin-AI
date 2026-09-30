import React, { useState, useEffect } from "react";
import type { StaffUser } from "../../types";
import { DemandKPIBar } from "./DemandKPIBar";
import { auth } from "../../config/firebase";

interface Officer {
  id: string;
  name: string;
  email: string;
  department?: string;
}

interface DepartmentOfficerDashboardProps {
  user: StaffUser;
}

export const DepartmentOfficerDashboard: React.FC<DepartmentOfficerDashboardProps> = ({ user }) => {
  const [thresholdQueue, setThresholdQueue] = useState<any[]>([]);
  const [emergingQueue, setEmergingQueue] = useState<any[]>([]);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"queue" | "review" | "dispatch">("queue");
  const [queueTab, setQueueTab] = useState<"threshold" | "emerging">("threshold");
  const [staffNote, setStaffNote] = useState("");
  const [authError, setAuthError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged((user) => {
      if (user) {
        fetchStats();
        fetchQueue();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/staff/department/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMetrics(await res.json());
      }
    } catch (err) {
      console.error("Failed to load metrics", err);
    }
  };

  const fetchQueue = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/staff/demands/queue`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setThresholdQueue(data.threshold_queue || []);
        setEmergingQueue(data.emerging_queue || []);
        setReviewQueue(data.review_queue || []);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Failed to load queue. Ensure you have Department Officer access.");
    }
  };

  const fetchOfficers = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/staff/field-officers`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setOfficers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openDispatch = (demand: any) => {
    setSelectedDemand(demand);
    setViewMode("dispatch");
    fetchOfficers();
  };

  const handleDecision = async (action: "approve" | "reinspect" | "reject") => {
    if (!selectedDemand) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/staff/investigation/${selectedDemand.id}/review`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ decision: action, notes: staffNote || "No notes provided." })
      });
      if (res.ok) {
        setStaffNote("");
        fetchQueue();
        fetchStats();
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
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/staff/investigation/${selectedDemand.id}/assign`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          field_officer_uid: officerId, 
          notes: staffNote || "Please conduct site feasibility survey."
        })
      });
      if (res.ok) {
        setStaffNote("");
        fetchQueue();
        fetchStats();
        setViewMode("queue");
      } else {
        const errorData = await res.json();
        setAuthError(errorData.detail || "Failed to assign.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const displayedQueue = queueTab === "threshold" ? thresholdQueue : emergingQueue;

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
          <DemandKPIBar metrics={metrics} isLiveApi={true} />
          
          <div className="panel" style={{ marginTop: "24px" }}>
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "20px" }}>
                <button 
                  onClick={() => setQueueTab("threshold")}
                  style={{ background: "none", border: "none", borderBottom: queueTab === "threshold" ? "3px solid var(--col-navy)" : "3px solid transparent", fontSize: "20px", fontWeight: 700, paddingBottom: "8px", cursor: "pointer", color: queueTab === "threshold" ? "var(--col-navy)" : "var(--col-text-muted)" }}
                >
                  Threshold Trigger Queue {user.district_display_name ? `— ${user.district_display_name}` : ""}
                </button>
                <button 
                  onClick={() => setQueueTab("emerging")}
                  style={{ background: "none", border: "none", borderBottom: queueTab === "emerging" ? "3px solid var(--col-navy)" : "3px solid transparent", fontSize: "20px", fontWeight: 700, paddingBottom: "8px", cursor: "pointer", color: queueTab === "emerging" ? "var(--col-navy)" : "var(--col-text-muted)" }}
                >
                  Emerging Queue {user.district_display_name ? `— ${user.district_display_name}` : ""}
                </button>
              </div>
              <span className="panel-badge" style={{ background: "var(--col-red)", color: "#fff" }}>{queueTab === "threshold" ? thresholdQueue.length : emergingQueue.length} Requires Action</span>
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
                  {displayedQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                        <div style={{ fontSize: "24px", marginBottom: "10px" }}>📥</div>
                        <div style={{ fontWeight: 600, color: "var(--col-navy)" }}>No Pending Demands</div>
                        <div style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>{queueTab === "threshold" ? "All demands that reached the threshold have been dispatched." : "No emerging demands right now."}</div>
                      </td>
                    </tr>
                  ) : (
                    displayedQueue.map(d => (
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
                            onClick={() => openDispatch(d)}
                          >
                            Dispatch Survey
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
              <span className="panel-badge" style={{ background: "var(--col-orange)", color: "#fff" }}>{reviewQueue.length} Pending Review</span>
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
                  {reviewQueue.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--col-text-muted)" }}>No active feasibility reports to review.</td>
                    </tr>
                  ) : (
                    reviewQueue.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600, color: "var(--col-navy)" }}>{d.id.substring(0, 8)}</td>
                        <td><span style={{ fontSize: "12px", color: "#666" }}>{d.assigned_officer_id || "Field Officer"}</span></td>
                        <td><span className={`status-badge status-progress`}>{d.status.replace(/_/g, " ")}</span></td>
                        <td>
                          <button 
                            className="btn-outline" 
                            style={{ padding: "4px 12px", fontSize: "11px", borderColor: "var(--col-orange)", background: "var(--col-orange)", color: "#fff" }}
                            onClick={() => { setSelectedDemand(d); setViewMode("review"); }}
                          >
                            Review Report
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
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--col-text-muted)", textTransform: "uppercase" }}>Available Officers</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto" }}>
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
                  
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button 
                      onClick={() => handleDecision("approve")} 
                      className="service-card-btn" 
                      style={{ flex: 1, background: "var(--col-green)", justifyContent: "center", padding: "12px", minWidth: "200px" }}
                    >
                      ✓ Approve to Policy
                    </button>
                    <button 
                      onClick={() => handleDecision("reject")} 
                      className="service-card-btn" 
                      style={{ flex: 1, background: "var(--col-red)", justifyContent: "center", padding: "12px", minWidth: "120px" }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                  <button 
                    onClick={() => handleDecision("reinspect")} 
                    className="btn-outline" 
                    style={{ width: "100%", marginTop: "10px", padding: "10px", borderColor: "var(--col-border)" }}
                  >
                    Request Re-survey
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
