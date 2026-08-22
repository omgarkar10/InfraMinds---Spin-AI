import "./Footer.css";

interface FooterProps {
  onViewChange: (view: "landing" | "dashboard" | "citizen") => void;
}

export function Footer({ onViewChange }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-statement">
          <h2 className="editorial-h2 footer-h2">
            Infrastructure should respond<br />to where people need it.
          </h2>
        </div>

        <div className="footer-identity">
          <p className="footer-wordmark">SPIN</p>
          <p className="footer-descriptor">Symbiotic Public Infrastructure Network</p>
          <p className="footer-tagline label-eyebrow">
            Citizen signals → AI intelligence → spatial context → policy action
          </p>
        </div>

        <div className="footer-actions">
          <button className="btn-outline" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            Explore Intelligence
          </button>
          <button className="btn-outline btn-outline-orange" onClick={() => onViewChange("dashboard")}>
            View Dashboard
          </button>
        </div>

        <div className="footer-meta">
          <p className="footer-built">Built for Code for Communities 2 · Google for India</p>
          <p className="footer-built">SPIN is a prototype. Demo data only.</p>
        </div>
      </div>
    </footer>
  );
}
