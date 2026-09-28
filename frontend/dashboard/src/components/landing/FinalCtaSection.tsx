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
            Have a vision for your community's future?
          </h2>
          <p className="body-lg final-cta-subtitle">
            Rally your neighbors and propose a public demand.
          </p>

          <div className="final-cta-buttons">
            <button
              className="btn-cta-primary"
              onClick={() => onViewChange("citizen-raise")}
            >
              Start a Public Demand
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
