import "./YourGrievancesSection.css";

interface YourGrievancesSectionProps {
  onViewChange: (view: "citizen-raise" | "citizen-track") => void;
}

export function YourGrievancesSection({ onViewChange }: YourGrievancesSectionProps) {
  return (
    <section className="grievances-section" id="grievances">
      <div className="container">
        <div className="grievances-header text-center">
          <span className="label-eyebrow tag-orange">CITIZEN PORTAL SERVICES</span>
          <h2 className="editorial-h2">
            Take action on <span className="text-highlight">your grievances</span>
          </h2>
          <p className="body-lg subtitle-center">
            Choose whether you want to submit a new complaint or check on an existing report.
          </p>
        </div>

        <div className="grievances-cards-grid">
          {/* CARD 1: RAISE A NEW GRIEVANCE */}
          <div className="grievance-action-card primary-card">
            <div className="card-top-tag">SERVICE 01 • INTAKE</div>
            <div className="card-icon-header">📝</div>
            <h3 className="card-action-title">Raise a New Grievance</h3>
            <p className="card-action-desc">
              Submit a new report about a public infrastructure or municipal service issue in your neighborhood.
            </p>
            <ul className="card-feature-list">
              <li>✓ Describe issues in your own words or voice</li>
              <li>✓ Upload photos & precise GPS location</li>
              <li>✓ Instant Grievance ID confirmation</li>
            </ul>
            <button
              className="card-action-btn btn-primary"
              onClick={() => onViewChange("citizen-raise")}
            >
              Report a Problem →
            </button>
          </div>

          {/* CARD 2: CHECK PREVIOUS GRIEVANCES */}
          <div className="grievance-action-card secondary-card">
            <div className="card-top-tag">SERVICE 02 • STATUS</div>
            <div className="card-icon-header">🔍</div>
            <h3 className="card-action-title">Check Previous Grievances</h3>
            <p className="card-action-desc">
              Track the current status, assigned department, and resolution progress of issues you have submitted.
            </p>
            <ul className="card-feature-list">
              <li>✓ Real-time status tracking with Grievance ID</li>
              <li>✓ Department routing & officer assignment</li>
              <li>✓ Official resolution updates & confirmation</li>
            </ul>
            <button
              className="card-action-btn btn-secondary"
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
