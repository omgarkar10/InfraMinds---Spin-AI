import React from "react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          maxWidth: "650px",
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--col-navy, #0f172a)",
            color: "#ffffff",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--col-orange, #e05a2b)" }}>
              SPIN PLATFORM · LEGAL &amp; USAGE TERMS
            </span>
            <h3 style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: 700 }}>
              Terms &amp; Conditions (Prototype / Hackathon)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", fontSize: "13px", lineHeight: "1.6", color: "#334155" }}>
          <p style={{ marginTop: 0 }}>
            Welcome to the <strong>Symbiotic Public Infrastructure Network (SPIN)</strong> Citizen Intake Portal.
            Please read these Terms &amp; Conditions carefully before registering an account or submitting infrastructure demands.
          </p>

          <ol style={{ paddingLeft: "20px", margin: "16px 0" }}>
            <li style={{ marginBottom: "12px" }}>
              <strong>Prototype &amp; Community Platform Scope:</strong> SPIN is a prototype research and civic technology platform designed to aggregate community infrastructure demands. It is operated for demonstration and evaluation purposes.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Data Processing &amp; Analytics:</strong> Information submitted by citizens (including descriptions, coordinates, categories, and evidence) will be processed for spatial clustering, infrastructure gap analysis, and policy decision support.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Accuracy of Submissions:</strong> Citizens agree to submit information that is accurate, truthful, and genuine to the best of their knowledge.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>No Guarantee of Government Funding:</strong> Submitting a request or proposal through SPIN does not constitute automatic approval, guarantee of municipal funding, or binding project execution by public authorities.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Privacy &amp; Data Security:</strong> Personal contact information is stored securely and handled according to platform privacy practices. Analytical views strip personally identifiable information.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>AI Processing &amp; Verification:</strong> The platform utilizes Artificial Intelligence (including Google Gemini) to extract, summarize, and categorize requests. AI outputs are advisory and may be reviewed, edited, or corrected by the citizen.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Prohibited Content:</strong> Users must not submit abusive, fraudulent, illegal, defamatory, or deceptive content. Submitting false reports may lead to account suspension.
            </li>
          </ol>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            background: "#f8fafc",
          }}
        >
          <button
            type="button"
            className="btn-outline"
            onClick={onClose}
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            Close
          </button>
          {onAccept && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onAccept();
                onClose();
              }}
              style={{ padding: "8px 20px", fontSize: "13px", background: "var(--col-orange, #e05a2b)" }}
            >
              I Accept Terms &amp; Conditions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
