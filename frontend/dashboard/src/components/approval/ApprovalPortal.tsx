import React, { useState, useEffect } from "react";
import { getApprovalRecords, type ApprovalRecord } from "../../services/approvalService";
import "./ApprovalPortal.css";

interface ApprovalPortalProps {
  onNavigate: (view: string) => void;
}

export const ApprovalPortal: React.FC<ApprovalPortalProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = () => {
    setRecords(getApprovalRecords());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const pendingCount = records.filter((r) => r.status === "pending").length;
  const approvedCount = records.filter((r) => r.status === "approved").length;
  const rejectedCount = records.filter((r) => r.status === "rejected").length;

  return (
    <div className="approval-portal-page">
      {/* Header Bar */}
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
                  INTER-MINISTERIAL CLEARANCE SYSTEM
                </span>
                <span className="user-badge-dot" />
                <span style={{ fontSize: "11px", color: "#4ADE80", letterSpacing: "0.1em" }}>
                  AUDIT LOG ACTIVE
                </span>
              </div>
              <h1 className="portal-heading" style={{ color: "#fff", fontSize: "22px" }}>
                Budget Reallocation Approval & Status Portal
              </h1>
              <p className="portal-subtext" style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                Track submission status, review trails, and ministerial clearance records across infrastructure categories.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              className="service-card-btn service-card-btn-orange"
              style={{ padding: "6px 14px", fontSize: "12px" }}
              onClick={() => onNavigate("ministry-login")}
            >
              🏛️ Ministry Sign-Off Portal →
            </button>
            <button
              className="btn-outline"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: "12px" }}
              onClick={() => onNavigate("dashboard")}
            >
              ← Policymaker Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: "24px", marginBottom: "40px" }}>
        {/* KPI Counter Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          <div className="stat-card">
            <span className="stat-label">TOTAL SUBMISSIONS</span>
            <span className="stat-value">{records.length}</span>
          </div>
          <div className="stat-card accent">
            <span className="stat-label">PENDING MINISTRY REVIEW</span>
            <span className="stat-value" style={{ color: "var(--col-orange)" }}>{pendingCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">MINISTRY APPROVED</span>
            <span className="stat-value" style={{ color: "var(--col-green)" }}>{approvedCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">REJECTED / REVISED</span>
            <span className="stat-value" style={{ color: "var(--col-red)" }}>{rejectedCount}</span>
          </div>
        </div>

        {/* Submissions Table Card */}
        <div className="form-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span className="label-eyebrow">FISCAL ALLOCATION AUDIT</span>
              <h2 className="portal-heading" style={{ fontSize: "18px" }}>Submitted Fiscal Reallocations</h2>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>Status Filter:</span>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "170px" }}
              >
                <option value="all">All Submissions ({records.length})</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="approved">Approved ({approvedCount})</option>
                <option value="rejected">Rejected ({rejectedCount})</option>
              </select>

              <button
                className="btn-outline"
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={loadData}
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--col-text-muted)", background: "var(--col-panel)", borderRadius: "8px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📑</div>
              <h3 style={{ fontSize: "16px", color: "var(--col-navy)", marginBottom: "6px" }}>
                No budget reallocation proposals found
              </h3>
              <p style={{ fontSize: "13px", maxWidth: "460px", margin: "0 auto 16px auto" }}>
                Proposals created in the Policymaker Dashboard (via "Submit Recommendation for Ministry Approval") will automatically populate this audit trail.
              </p>
              <button
                className="service-card-btn service-card-btn-orange"
                style={{ margin: "0 auto", padding: "8px 16px" }}
                onClick={() => onNavigate("dashboard")}
              >
                Open Policymaker Dashboard →
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="approval-table">
                <thead>
                  <tr>
                    <th>APPROVAL ID</th>
                    <th>CATEGORY</th>
                    <th>JURISDICTION</th>
                    <th>CURRENT</th>
                    <th>PROPOSED</th>
                    <th>DELTA</th>
                    <th>SUBMITTED AT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => {
                    const delta = r.proposed_cr - r.current_cr;
                    return (
                      <tr key={r.id}>
                        <td className="mono" style={{ fontWeight: "700" }}>{r.id}</td>
                        <td style={{ fontWeight: "600", color: "var(--col-navy)" }}>{r.category}</td>
                        <td>
                          {r.state || r.district ? (
                            <span>{r.district ? `${r.district}, ` : ""}{r.state || "All India"}</span>
                          ) : (
                            <span style={{ color: "var(--col-text-muted)" }}>National / All</span>
                          )}
                        </td>
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
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td>
                          <span className={`approval-status-badge status-${r.status}`}>
                            {r.status === "pending" && "⏳ PENDING REVIEW"}
                            {r.status === "approved" && "✅ APPROVED"}
                            {r.status === "rejected" && "❌ REJECTED"}
                          </span>
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
    </div>
  );
};
