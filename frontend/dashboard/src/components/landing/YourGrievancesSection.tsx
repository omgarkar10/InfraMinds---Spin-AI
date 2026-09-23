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
            <div className="card-icon-header">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
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
            <div className="card-icon-header">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
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
