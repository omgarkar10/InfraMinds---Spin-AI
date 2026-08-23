import "./LanguageTrustSection.css";

export function LanguageTrustSection() {
  return (
    <section className="language-trust-section" id="language">
      <div className="container">
        <div className="language-trust-card">
          <div className="trust-icon">🌐</div>
          <div className="trust-content">
            <span className="label-eyebrow tag-blue">MULTILINGUAL ACCESSIBILITY</span>
            <h2 className="editorial-h2 trust-heading">
              Speak in the language you're <span className="text-highlight">comfortable with.</span>
            </h2>
            <p className="body-lg trust-desc">
              SPIN is designed to make civic reporting accessible across languages, so citizens can communicate in the language they are most comfortable using.
            </p>
            <div className="languages-pill-row">
              <span className="lang-chip">English</span>
              <span className="lang-chip">हिन्दी (Hindi)</span>
              <span className="lang-chip">मराठी (Marathi)</span>
              <span className="lang-chip">தமிழ் (Tamil)</span>
              <span className="lang-chip">తెలుగు (Telugu)</span>
              <span className="lang-chip">বাংলা (Bengali)</span>
              <span className="lang-chip">+ 16 Official Languages</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
