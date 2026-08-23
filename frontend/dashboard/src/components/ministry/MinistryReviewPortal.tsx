import React, { useState, useEffect } from "react";
import { getApprovalRecords, updateApprovalStatus, type ApprovalRecord } from "../../services/approvalService";
import type { StaffUser } from "../../types";
import "../../styles/citizen.css";
import "../approval/ApprovalPortal.css";

interface MinistryReviewPortalProps {
  user: StaffUser;
  onNavigate: (view: string) => void;
}

export const MinistryReviewPortal: React.FC<MinistryReviewPortalProps> = ({ user, onNavigate }) => {
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ApprovalRecord | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [statusTab, setStatusTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const loadData = () => {
    const list = getApprovalRecords();
    setRecords(list);
    if (selectedRecord) {
      const updated = list.find((r) => r.id === selectedRecord.id);
      if (updated) setSelectedRecord(updated);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = (status: "approved" | "rejected") => {
    if (!selectedRecord) return;
    const ok = updateApprovalStatus(selectedRecord.id, status, `${user.name} (${user.department})`, notes);
    if (ok) {
      setActionSuccess(`Proposal ${selectedRecord.id} has been ${status.toUpperCase()}. Audit log updated.`);
      setNotes("");
      loadData();
      setTimeout(() => setActionSuccess(""), 4000);
    }
  };

  const filtered = records.filter((r) => {
    if (statusTab === "all") return true;
    return r.status === statusTab;
  });

  const pendingCount = records.filter((r) => r.status === "pending").length;
  const approvedCount = records.filter((r) => r.status === "approved").length;
  const rejectedCount = records.filter((r) => r.status === "rejected").length;

  return (
    <div className="approval-portal-page">
      {/* Top Header */}
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
                <span className="portal-org" style={{ color: "var(--col-orange)" }}>
                  UNION MINISTERIAL CLEARANCE PORTAL
                </span>
                <span className="user-badge-dot" />
                <span style={{ fontSize: "11px", color: "#4ADE80", letterSpacing: "0.1em" }}>
                  AUTHORITY ACTIVE
                </span>
              </div>
              <h1 className="portal-heading" style={{ color: "#fff", fontSize: "22px" }}>
                Fiscal Proposal Evaluation & Clearance Desk
              </h1>
              <p className="portal-subtext" style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                Reviewing Officer: <strong>{user.name}</strong> · Ministry: <strong>{user.department}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              className="btn-outline"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: "12px" }}
              onClick={() => onNavigate("approval-portal")}
            >
              📋 All Approval Records
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: "24px", marginBottom: "40px" }}>
        {actionSuccess && (
          <div style={{
            padding: "12px 16px", background: "#ecfdf5", border: "1px solid #10b981",
            borderRadius: "6px", color: "#065f46", fontSize: "13px", fontWeight: "600", marginBottom: "20px"
          }}>
            ✅ {actionSuccess}
          </div>
        )}

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--col-border)", paddingBottom: "10px" }}>
          <button
            className={`btn-outline ${statusTab === "pending" ? "btn-outline-orange" : ""}`}
            style={{ fontWeight: statusTab === "pending" ? "700" : "400" }}
            onClick={() => setStatusTab("pending")}
          >
            ⏳ Pending Review ({pendingCount})
          </button>
          <button
            className={`btn-outline ${statusTab === "approved" ? "btn-outline-orange" : ""}`}
            style={{ fontWeight: statusTab === "approved" ? "700" : "400" }}
            onClick={() => setStatusTab("approved")}
          >
            ✅ Approved ({approvedCount})
          </button>
          <button
            className={`btn-outline ${statusTab === "rejected" ? "btn-outline-orange" : ""}`}
            style={{ fontWeight: statusTab === "rejected" ? "700" : "400" }}
            onClick={() => setStatusTab("rejected")}
          >
            ❌ Rejected ({rejectedCount})
          </button>
          <button
            className={`btn-outline ${statusTab === "all" ? "btn-outline-orange" : ""}`}
            style={{ fontWeight: statusTab === "all" ? "700" : "400" }}
            onClick={() => setStatusTab("all")}
          >
            All Submissions ({records.length})
          </button>
        </div>

        {/* Proposals List */}
        <div className="form-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <span className="label-eyebrow">FISCAL DISPATCH QUEUE</span>
              <h2 className="portal-heading" style={{ fontSize: "18px" }}>
                {statusTab === "pending" ? "Proposals Requiring Ministerial Action" : "Budget Reallocation History"}
              </h2>
            </div>
            <button className="btn-outline" style={{ fontSize: "12px" }} onClick={loadData}>
              ↻ Refresh
            </button>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--col-text-muted)", background: "var(--col-panel)", borderRadius: "8px" }}>
              <p style={{ fontSize: "14px" }}>No proposals in "{statusTab}" status.</p>
              <p style={{ fontSize: "12px", marginTop: "6px" }}>
                New reallocation submissions made by policymakers will appear here for ministerial clearance.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="approval-table">
                <thead>
                  <tr>
                    <th>PROPOSAL ID</th>
                    <th>INFRASTRUCTURE CATEGORY</th>
                    <th>JURISDICTION</th>
                    <th>CURRENT</th>
                    <th>PROPOSED</th>
                    <th>CHANGE</th>
                    <th>SUBMISSION DATE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const delta = r.proposed_cr - r.current_cr;
                    return (
                      <tr key={r.id}>
                        <td className="mono" style={{ fontWeight: "700" }}>{r.id}</td>
                        <td style={{ fontWeight: "600", color: "var(--col-navy)" }}>{r.category}</td>
                        <td>{r.district ? `${r.district}, ` : ""}{r.state || "All India"}</td>
                        <td>₹{r.current_cr} Cr</td>
                        <td style={{ fontWeight: "700", color: "var(--col-navy)" }}>₹{r.proposed_cr} Cr</td>
                        <td>
                          <span style={{
                            color: delta > 0 ? "var(--col-orange)" : delta < 0 ? "var(--col-red)" : "inherit",
                            fontWeight: "700"
                          }}>
                            {delta >= 0 ? "+" : ""}{delta} Cr
                          </span>
                        </td>
                        <td style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>
                          {new Date(r.submittedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td>
                          <span className={`approval-status-badge status-${r.status}`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            className="service-card-btn service-card-btn-orange"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                            onClick={() => { setSelectedRecord(r); setNotes(r.ministryNotes || ""); }}
                          >
                            Review Proposal →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRecord && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,30,54,0.6)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", borderTop: "4px solid var(--col-orange)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="label-eyebrow" style={{ color: "var(--col-orange)" }}>MINISTERIAL CLEARANCE REVIEW</span>
                <h2 className="portal-heading" style={{ fontSize: "20px" }}>{selectedRecord.id}</h2>
                <p className="portal-subtext" style={{ fontSize: "13px" }}>
                  Category: <strong>{selectedRecord.category}</strong> · Jurisdiction: <strong>{selectedRecord.district ? `${selectedRecord.district}, ` : ""}{selectedRecord.state || "All India"}</strong>
                </p>
              </div>
              <button className="btn-outline" style={{ padding: "4px 10px" }} onClick={() => setSelectedRecord(null)}>
                ✕ Close
              </button>
            </div>

            {/* Financial Summary Card */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", margin: "16px 0", background: "var(--col-panel)", padding: "14px", borderRadius: "6px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "var(--col-text-muted)", display: "block" }}>CURRENT BUDGET</span>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--col-navy)" }}>₹{selectedRecord.current_cr} Cr</span>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "var(--col-text-muted)", display: "block" }}>PROPOSED BUDGET</span>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--col-orange)" }}>₹{selectedRecord.proposed_cr} Cr</span>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "var(--col-text-muted)", display: "block" }}>AI RECOMMENDED</span>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--col-green)" }}>₹{selectedRecord.recommended_cr || selectedRecord.proposed_cr} Cr</span>
              </div>
            </div>

            {/* AI Policy Context */}
            <div className="process-flow-box" style={{ background: "var(--col-orange-dim)", border: "1px solid var(--col-orange-line)", padding: "14px", marginBottom: "16px" }}>
              <strong style={{ fontSize: "12px", color: "var(--col-navy)", display: "block", marginBottom: "4px" }}>
                AI POLICY JUSTIFICATION & DATA CORRELATION:
              </strong>
              <p style={{ fontSize: "12px", color: "var(--col-text-mid)", margin: 0 }}>
                Budget adjustment recommended based on civic grievance escalation patterns, red zone density metrics, and infrastructure demand in {selectedRecord.state || "target jurisdiction"}.
              </p>
            </div>

            {/* Notes / Directives */}
            <div className="form-group">
              <label className="form-label">Ministry Official Directives / Remarks</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter Ministry approval conditions, expenditure code, or rejection rationale..."
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="service-card-btn service-card-btn-orange"
                  onClick={() => handleAction("approved")}
                >
                  ✓ Grant Ministerial Approval
                </button>
                <button
                  className="btn-outline"
                  style={{ color: "var(--col-red)", borderColor: "rgba(220,38,38,0.3)" }}
                  onClick={() => handleAction("rejected")}
                >
                  ✕ Reject / Request Revision
                </button>
              </div>

              <span style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>
                Current Status: <strong>{selectedRecord.status.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
