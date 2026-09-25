import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { getRequestDetailFromBackend, getGrievanceById } from "../../services/grievanceService";
import type { CitizenUser } from "../../types";

interface GrievanceDetailProps {
  user: CitizenUser;
  grievanceId: string;
  onNavigate: (view: string) => void;
}

export const GrievanceDetail: React.FC<GrievanceDetailProps> = ({
  grievanceId,
  onNavigate,
}) => {
  const [proposal, setGrievance] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!grievanceId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Try authoritative backend first
        const data = await getRequestDetailFromBackend(grievanceId);
        setGrievance(data);
      } catch (err: any) {
        // Fallback to local storage (e.g. For seed or offline preview)
        const local = getGrievanceById(grievanceId);
        if (local) {
          setGrievance(local);
        } else {
          setError(err.message || "Request not found in authoritative registry.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [grievanceId]);

  if (loading) {
    return (
      <div className="citizen-portal-container">
        <div className="container" style={{ maxWidth: "600px", textAlign: "center", padding: "60px 0" }}>
          <div className="form-card">
            <p className="portal-subtext">Loading request details from official registry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="citizen-portal-container">
        <div className="container" style={{ maxWidth: "600px", textAlign: "center", padding: "60px 0" }}>
          <div className="form-card">
            <h2 className="editorial-h3" style={{ fontSize: "20px" }}>Request Not Found</h2>
            <p className="portal-subtext" style={{ margin: "12px 0 20px 0" }}>
              {error || `No verified request found matching ID: ${grievanceId}`}
            </p>
            <button className="service-card-btn" onClick={() => onNavigate("citizen-track")}>
              ← Back to My Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const reqId = proposal.grievance_id || proposal.id;
  const isNewDev = proposal.request_type === "new_development";
  const evidenceList = proposal.evidence_urls || (proposal.evidence?.photos || []);

  return (
    <div className="citizen-portal-container">
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("citizen-track")}>
            ← Back to My Requests
          </button>
          <span className="label-eyebrow">OFFICIAL GOVERNMENT RECORD</span>
        </div>

        {/* Top Header Card */}
        <div className="form-card" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <span className="mono" style={{ fontSize: "22px", fontWeight: "800", color: "var(--col-navy)" }}>
                  {reqId}
                </span>
                <span className={`status-pill ${proposal.status || "SUBMITTED"}`}>
                  {(proposal.status || "SUBMITTED").replace(/_/g, " ")}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: isNewDev ? "rgba(59, 130, 246, 0.1)" : "rgba(224, 90, 43, 0.1)",
                    color: isNewDev ? "#2563eb" : "var(--col-orange)",
                    fontWeight: 700,
                  }}
                >
                  {isNewDev ? "🏗️ New Development Proposal" : "⚠️ Current Infrastructure Need"}
                </span>
              </div>
              <h2 className="portal-heading" style={{ fontSize: "20px", marginTop: "6px" }}>
                {proposal.category} — {proposal.specific_issue || proposal.issueType || "General Civic Need"}
              </h2>
              <p className="portal-subtext" style={{ fontSize: "13px" }}>
                Recorded on {proposal.created_at ? new Date(proposal.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Today"}
              </p>
            </div>

            <button className="btn-outline" style={{ fontSize: "12px" }} onClick={() => window.print()}>
              📄 Print Acknowledgement
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", background: "var(--col-panel)", padding: "14px", borderRadius: "6px", marginTop: "16px", fontSize: "13px" }}>
            <div><strong>Routing Authority:</strong> {proposal.domain || proposal.category || "Municipal Administration"}</div>
            <div><strong>Location:</strong> {proposal.district || (proposal.location?.district)}, {proposal.state || (proposal.location?.state)}</div>
            <div><strong>Persistence:</strong> Authoritative SQLite</div>
            <div><strong>Warehouse Sync:</strong> {proposal.bigquery_synced ? "✓ Synchronized" : "Pending Scheduled Batch"}</div>
          </div>
        </div>

        {/* Two-Column Detail Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", marginBottom: "24px" }}>
          {/* Left Column: Full Particulars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-card">
              <span className="label-eyebrow">CITIZEN DESCRIPTION</span>
              <p style={{ marginTop: "8px", fontSize: "14px", lineHeight: "1.6", color: "var(--col-navy)", whiteSpace: "pre-wrap" }}>
                {proposal.original_text || proposal.description}
              </p>

              {/* Conditional Type B Details */}
              {isNewDev && (
                <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "12px", marginTop: "16px", fontSize: "13px" }}>
                  {proposal.reason && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Civic Justification:</strong> {proposal.reason}
                    </div>
                  )}
                  {proposal.intended_beneficiaries && (
                    <div>
                      <strong>Intended Beneficiaries:</strong> {proposal.intended_beneficiaries}
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Type A Details */}
              {!isNewDev && (
                <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "12px", marginTop: "16px", fontSize: "13px" }}>
                  {proposal.start_date && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>Started:</strong> {proposal.start_date}
                    </div>
                  )}
                  {proposal.frequency && (
                    <div>
                      <strong>Frequency:</strong> {proposal.frequency}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Card */}
            <div className="form-card">
              <span className="label-eyebrow">VERIFIED LOCATION</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", marginTop: "8px" }}>
                <div><strong>State:</strong> {proposal.state || (proposal.location?.state) || "Not specified"}</div>
                <div><strong>District:</strong> {proposal.district || (proposal.location?.district) || "Not specified"}</div>
                <div><strong>Address:</strong> {proposal.address || (proposal.location?.address) || "Locality registered"}</div>
                <div><strong>Landmark:</strong> {proposal.landmark || (proposal.location?.landmark) || "None"}</div>
                <div><strong>PIN Code:</strong> {proposal.pincode || (proposal.location?.pinCode) || "None"}</div>
                <div>
                  <strong>Coordinates:</strong>{" "}
                  {proposal.latitude && proposal.longitude
                    ? `${proposal.latitude}, ${proposal.longitude}`
                    : proposal.location?.lat
                    ? `${proposal.location.lat}, ${proposal.location.lng}`
                    : "Manual District Registration"}
                </div>
              </div>
            </div>

            {/* Evidence Card */}
            <div className="form-card">
              <span className="label-eyebrow">SUPPORTING EVIDENCE</span>
              <div style={{ marginTop: "8px", fontSize: "13px" }}>
                {evidenceList && evidenceList.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {evidenceList.map((url: string, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📎</span>
                        <a
                          href={`http://localhost:8080${url}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--col-orange)", textDecoration: "underline" }}
                        >
                          View Attachment {idx + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "var(--col-text-muted)" }}>No external evidence files attached.</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Official Lifecycle Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-card">
              <span className="label-eyebrow">RESOLUTION TIMELINE</span>
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {(proposal.timeline || []).map((t: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: t.completed ? "var(--col-green)" : "var(--col-border)",
                        marginTop: "4px",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--col-navy)" }}>{t.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>{t.date} · {t.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Governance Callout */}
            <div className="gov-disclaimer-callout">
              <span>🏛️</span>
              <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
                <strong>SPIN POLICY ASSURANCE:</strong> Your submission has been securely ingested into the authoritative municipal database. All decisions and resolution timelines remain under the audit of authorized civic officers.
              </div>
            </div>

            <div style={{ marginTop: "32px", textAlign: "center" }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => onNavigate("citizen-track")}
              >
                ← Go Back to My Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
