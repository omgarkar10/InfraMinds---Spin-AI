import React from "react";
import "./HowItHelpsSection.css";

export function HowItHelpsSection() {
  const steps = [
    {
      num: "01",
      title: "Tell us",
      desc: "Describe the problem in text, voice or photo.",
      icon: "💬"
    },
    {
      num: "02",
      title: "We understand",
      desc: "SPIN helps organize your complaint and identify the issue.",
      icon: "⚡"
    },
    {
      num: "03",
      title: "It reaches the right place",
      desc: "Your complaint is connected to the appropriate location and department.",
      icon: "🏛️"
    },
    {
      num: "04",
      title: "Stay informed",
      desc: "Track your grievance and receive updates.",
      icon: "🔔"
    }
  ];

  return (
    <section className="how-it-helps-section" id="how-it-helps">
      <div className="container">
        <div className="how-it-helps-header text-center">
          <span className="label-eyebrow tag-orange">SIMPLE 4-STEP JOURNEY</span>
          <h2 className="editorial-h2">
            How SPIN <span className="text-highlight">helps you</span>
          </h2>
          <p className="body-lg subtitle-center">
            From reporting an issue in your neighborhood to getting it resolved by local authorities.
          </p>
        </div>

        <div className="journey-flow-grid">
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className="journey-step-card">
                <div className="step-card-top">
                  <span className="step-number-badge">{step.num}</span>
                  <span className="step-icon">{step.icon}</span>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
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
