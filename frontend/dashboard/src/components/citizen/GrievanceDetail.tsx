import React, { useState } from "react";
import "../../styles/citizen.css";
import { getGrievanceById, addCitizenFeedback } from "../../services/grievanceService";
import type { CitizenUser, Grievance } from "../../types";

interface GrievanceDetailProps {
  user: CitizenUser;
  grievanceId: string;
  onNavigate: (view: string) => void;
}

export const GrievanceDetail: React.FC<GrievanceDetailProps> = ({
  grievanceId,
  onNavigate,
}) => {
  const [grievance, setGrievance] = useState<Grievance | undefined>(() =>
    getGrievanceById(grievanceId)
  );

  /* Feedback State */
  const [feedbackResolved, setFeedbackResolved] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [reopenReason, setReopenReason] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(
    Boolean(grievance?.feedback)
  );

  if (!grievance) {
    return (
      <div className="citizen-portal-container">
        <div className="container" style={{ maxWidth: "600px", textAlign: "center", padding: "60px 0" }}>
          <div className="form-card">
            <h2>Grievance Not Found</h2>
            <p className="portal-subtext">No grievance found matching ID: {grievanceId}</p>
            <button className="service-card-btn" onClick={() => onNavigate("citizen-track")}>
              ← Back to My Grievances
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFeedbackSubmit = (resolved: boolean) => {
    const updated = addCitizenFeedback(
      grievance.id,
      resolved,
      resolved ? rating : undefined,
      resolved ? feedbackComment : undefined,
      !resolved ? reopenReason : undefined
    );
    if (updated) {
      setGrievance(updated);
      setFeedbackSubmitted(true);
    }
  };

  return (
    <div className="citizen-portal-container">
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Breadcrumb & Navigation */}
        <div style={{ marginBottom: "16px" }}>
          <button className="btn-outline" style={{ fontSize: "11px" }} onClick={() => onNavigate("citizen-track")}>
            ← Back to My Grievances
          </button>
        </div>

        {/* Top Grievance Card */}
        <div className="form-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span className="label-eyebrow">OFFICIAL GRIEVANCE DOSSIER</span>
              <h1 className="portal-heading" style={{ fontSize: "24px" }}>
                {grievance.id}
              </h1>
              <p className="portal-subtext" style={{ fontSize: "15px", fontWeight: "600", color: "var(--col-navy)" }}>
                {grievance.category} — {grievance.issueType}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <span className={`status-pill ${grievance.status}`}>
                {grievance.status.replace(/_/g, " ")}
              </span>
              <div style={{ fontSize: "11px", color: "var(--col-text-muted)", marginTop: "4px" }}>
                Last updated: {grievance.updatedAt}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "16px" }}>
            <span className="label-eyebrow">RESOLUTION TIMELINE</span>
            <div className="grievance-timeline">
              {grievance.timeline.map((item, idx) => (
                <div key={idx} className={`timeline-event-item ${item.completed ? "completed" : ""}`}>
                  <span className="timeline-event-date">{item.date}</span>
                  <strong className="timeline-event-title">{item.title}</strong>
                  <p className="timeline-event-desc">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why was this routed here? Callout Box */}
        <div className="process-flow-box" style={{ background: "var(--col-orange-dim)", border: "1px solid var(--col-orange-line)", marginBottom: "24px" }}>
          <span className="label-orange">SPIN SPATIAL INTELLIGENCE RATIONALE</span>
          <h3 className="editorial-h3" style={{ fontSize: "18px", marginTop: "4px", color: "var(--col-navy)" }}>
            Why was this routed to {grievance.department}?
          </h3>
          <p className="body-md" style={{ marginTop: "6px", color: "var(--col-navy)" }}>
            "{grievance.aiAnalysis.reasoning}"
          </p>
          <div style={{ fontSize: "12px", color: "var(--col-text-mid)", marginTop: "8px" }}>
            <strong>Spatial Correlation:</strong> {grievance.aiAnalysis.nearbyGrievances} matching citizen signals detected near {grievance.location.address}.
          </div>
        </div>

        {/* Grid of Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
          <div className="form-card" style={{ padding: "20px" }}>
            <span className="label-eyebrow">ISSUE & EVIDENCE DETAILS</span>
            <table className="data-table" style={{ marginTop: "8px" }}>
              <tbody>
                <tr>
                  <td>SEVERITY</td>
                  <td><span style={{ color: "var(--col-red)", fontWeight: "700" }}>{grievance.severity}</span></td>
                </tr>
                <tr>
                  <td>START DATE</td>
                  <td>{grievance.startDate} ({grievance.frequency})</td>
                </tr>
                <tr>
                  <td>DESCRIPTION</td>
                  <td>{grievance.description}</td>
                </tr>
                {grievance.evidence.voiceText && (
                  <tr>
                    <td>VOICE TRANSCRIPT</td>
                    <td style={{ fontStyle: "italic", color: "var(--col-navy)" }}>"{grievance.evidence.voiceText}"</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="form-card" style={{ padding: "20px" }}>
            <span className="label-eyebrow">LOCATION & DEPARTMENT</span>
            <table className="data-table" style={{ marginTop: "8px" }}>
              <tbody>
                <tr>
                  <td>ADDRESS</td>
                  <td>{grievance.location.address}</td>
                </tr>
                <tr>
                  <td>DISTRICT</td>
                  <td>{grievance.location.district}, {grievance.location.state}</td>
                </tr>
                <tr>
                  <td>DEPARTMENT</td>
                  <td><strong>{grievance.department}</strong></td>
                </tr>
                <tr>
                  <td>ASSIGNED OFFICER</td>
                  <td>{grievance.assignedTo}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Citizen Notification / Feedback Loop */}
        <div className="form-card" style={{ borderTop: "4px solid var(--col-navy)" }}>
          <span className="label-eyebrow">CITIZEN FEEDBACK & VERIFICATION</span>
          <h3 className="portal-heading" style={{ fontSize: "18px" }}>Have municipal authorities resolved your issue?</h3>

          {feedbackSubmitted && grievance.feedback ? (
            <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "6px" }}>
              <span className="label-orange">FEEDBACK RECORDED</span>
              <p className="body-md" style={{ color: "var(--col-navy)", marginTop: "4px" }}>
                {grievance.feedback.resolved
                  ? `✓ You confirmed this grievance is RESOLVED (${grievance.feedback.rating}/5 stars).`
                  : `⚠️ You flagged that this grievance is STILL UNRESOLVED. It has been escalated to municipal audit.`}
              </p>
              {grievance.feedback.comment && <p className="body-sm">"{grievance.feedback.comment}"</p>}
              {grievance.feedback.reopenReason && <p className="body-sm">Reason: "{grievance.feedback.reopenReason}"</p>}
              <span className="disclaimer" style={{ marginTop: "8px", display: "block" }}>
                Your feedback is logged on the SPIN governance record.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  className={`service-card-btn ${feedbackResolved === true ? "service-card-btn-orange" : ""}`}
                  style={{ background: feedbackResolved === true ? "var(--col-green)" : "var(--col-panel)", color: feedbackResolved === true ? "#fff" : "var(--col-navy)", border: "1px solid var(--col-border)" }}
                  onClick={() => setFeedbackResolved(true)}
                >
                  ✓ Yes, issue is resolved
                </button>
                <button
                  className={`service-card-btn ${feedbackResolved === false ? "service-card-btn-orange" : ""}`}
                  style={{ background: feedbackResolved === false ? "var(--col-red)" : "var(--col-panel)", color: feedbackResolved === false ? "#fff" : "var(--col-navy)", border: "1px solid var(--col-border)" }}
                  onClick={() => setFeedbackResolved(false)}
                >
                  ✕ No, still facing the issue
                </button>
              </div>

              {/* Resolved Rating Form */}
              {feedbackResolved === true && (
                <div style={{ background: "var(--col-panel)", padding: "16px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label className="form-label">Rate Resolution Quality (1–5 Stars)</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: rating >= star ? "var(--col-orange)" : "var(--col-surface)",
                          color: rating >= star ? "#fff" : "var(--col-text)",
                          border: "1px solid var(--col-border-strong)",
                          borderRadius: "4px",
                          width: "36px",
                          height: "36px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Additional Feedback (Optional)</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Add any comments about the work done..."
                    />
                  </div>

                  <button className="service-card-btn service-card-btn-orange" onClick={() => handleFeedbackSubmit(true)}>
                    Submit Resolution Feedback →
                  </button>
                </div>
              )}

              {/* Unresolved Reopen Form */}
              {feedbackResolved === false && (
                <div style={{ background: "var(--col-red-dim)", padding: "16px", borderRadius: "6px", border: "1px solid rgba(220,38,38,0.3)", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label className="form-label" style={{ color: "var(--col-red)" }}>Describe why the issue is not resolved *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="e.g. Pipeline was temporarily patched but leaking again..."
                    required
                  />

                  <button className="service-card-btn" style={{ background: "var(--col-red)" }} onClick={() => handleFeedbackSubmit(false)}>
                    Reopen & Escalate Grievance →
                  </button>
                </div>
              )}
            </div>
          )}

          <span className="disclaimer" style={{ marginTop: "12px" }}>
            "Your response will be added directly to the official government grievance record."
          </span>
        </div>
      </div>
    </div>
  );
};
