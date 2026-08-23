import "./FinalCtaSection.css";

interface FinalCtaSectionProps {
  onViewChange: (view: "citizen-raise" | "citizen-track") => void;
}

export function FinalCtaSection({ onViewChange }: FinalCtaSectionProps) {
  return (
    <section className="final-cta-section" id="final-cta">
      <div className="container">
        <div className="final-cta-card text-center">
          <span className="label-eyebrow tag-orange">TAKE ACTION TODAY</span>
          <h2 className="editorial-h2 final-cta-title">
            Have a problem in your area?
          </h2>
          <p className="body-lg final-cta-subtitle">
            Report it to your local administration.
          </p>

          <div className="final-cta-buttons">
            <button
              className="btn-cta-primary"
              onClick={() => onViewChange("citizen-raise")}
            >
              Report a Problem →
            </button>
            <button
              className="btn-cta-secondary"
              onClick={() => onViewChange("citizen-track")}
            >
              Track My Grievance →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
