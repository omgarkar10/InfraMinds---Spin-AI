import React from "react";
import "./HowItHelpsSection.css";

export function HowItHelpsSection() {
  const steps = [
    {
      num: "01",
      title: "REQUEST RECEIVED",
      desc: "Your request is securely recorded with the details, location and supporting information you provide.",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
      hoverTitle: "What happens here?",
      hoverInput: "Citizen's submitted request",
      hoverProcessing: "Secure logging and geo-tagging",
      hoverOutput: "Raw civic demand record"
    },
    {
      num: "02",
      title: "REQUEST UNDERSTOOD",
      desc: "SPIN analyses the request to identify the issue, category, severity and relevant department.",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
      hoverTitle: "What happens here?",
      hoverInput: "Raw civic demand record",
      hoverProcessing: "Category + severity + department identification",
      hoverOutput: "Structured request record"
    },
    {
      num: "03",
      title: "ROUTED TO THE RIGHT AUTHORITY",
      desc: "The request is matched with the appropriate department and geographic jurisdiction for review.",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>,
      hoverTitle: "What happens here?",
      hoverInput: "Structured request record",
      hoverProcessing: "Jurisdictional boundary matching",
      hoverOutput: "Official department assignment"
    },
    {
      num: "04",
      title: "ACTION & UPDATES",
      desc: "The concerned authority reviews the request, takes appropriate action and updates its status for the citizen.",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
      hoverTitle: "What happens here?",
      hoverInput: "Official department assignment",
      hoverProcessing: "Government review and resource allocation",
      hoverOutput: "Resolution and status update"
    }
  ];

  return (
    <section className="how-it-helps-section" id="how-it-helps">
      <div className="container">
        <div className="how-it-helps-header text-center">
          <span className="label-eyebrow tag-orange">WHAT HAPPENS AFTER YOU SUBMIT</span>
          <h2 className="editorial-h2">
            How SPIN processes your request
          </h2>
          <p className="body-lg subtitle-center">
            Once submitted, your request is reviewed, classified and routed to the appropriate authority for action.
          </p>
        </div>

        <div className="text-center" style={{ marginTop: "2.5rem" }}>
          <span className="system-flow-label">CITIZEN REQUEST → GOVERNMENT ACTION</span>
        </div>

        <div className="journey-flow-grid">
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className="journey-step-card group">
                <div className="step-card-default">
                  <div className="step-card-top">
                    <span className="step-number-badge">{step.num}</span>
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
                
                {/* Hover Detail Overlay */}
                <div className="step-card-hover-overlay">
                  <h4 className="hover-title">{step.hoverTitle}</h4>
                  <div className="hover-detail-row">
                    <span className="hover-detail-label">Input:</span>
                    <span className="hover-detail-val">{step.hoverInput}</span>
                  </div>
                  <div className="hover-detail-row">
                    <span className="hover-detail-label">Processing:</span>
                    <span className="hover-detail-val">{step.hoverProcessing}</span>
                  </div>
                  <div className="hover-detail-row">
                    <span className="hover-detail-label">Output:</span>
                    <span className="hover-detail-val">{step.hoverOutput}</span>
                  </div>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="journey-connector" aria-hidden="true">
                  <span className="connector-arrow">→</span>
                  <span className="connector-arrow-mobile">↓</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
