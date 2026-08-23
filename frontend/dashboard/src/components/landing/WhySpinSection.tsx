import "./WhySpinSection.css";

export function WhySpinSection() {
  return (
    <section className="why-spin-section" id="why-spin">
      <div className="container">
        <div className="why-spin-header">
          <span className="label-eyebrow tag-navy">WHY SPIN</span>
          <h2 className="editorial-h2">
            Every citizen deserves <br />
            <span className="text-highlight">responsive public infrastructure.</span>
          </h2>
          <p className="body-lg why-spin-lead">
            Roads, water, electricity and other public services affect everyday life. SPIN gives citizens a simple way to report these problems and helps authorities see where communities need attention.
          </p>
        </div>

        <div className="why-spin-benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">📱</div>
            <h3 className="benefit-title">Report problems easily</h3>
            <p className="benefit-desc">
              Submit issues quickly from your mobile phone or computer without complicated administrative forms.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">🗣️</div>
            <h3 className="benefit-title">Submit in your language</h3>
            <p className="benefit-desc">
              Speak or write in the language you are most comfortable using. SPIN breaks down language barriers.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">📍</div>
            <h3 className="benefit-title">Add location & photos</h3>
            <p className="benefit-desc">
              Attach precise GPS locations and photos so maintenance teams know exactly where to take action.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">📋</div>
            <h3 className="benefit-title">Track your complaint</h3>
            <p className="benefit-desc">
              Get a unique Grievance ID to monitor real-time department routing and resolution progress.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">🔔</div>
            <h3 className="benefit-title">Receive live updates</h3>
            <p className="benefit-desc">
              Stay informed as your grievance moves from initial review to on-ground repair completion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
