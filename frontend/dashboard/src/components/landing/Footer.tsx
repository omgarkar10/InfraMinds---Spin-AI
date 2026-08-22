import "./Footer.css";

interface FooterProps {
  onViewChange: (view: "landing" | "dashboard" | "citizen") => void;
}

export function Footer({ onViewChange }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-wordmark">SPIN</span>
            <span className="footer-descriptor">SYMBIOTIC PUBLIC INFRASTRUCTURE NETWORK</span>
            <p className="footer-tagline">
              Citizen signals → Multilingual AI → Spatial context → Policy action
            </p>
          </div>

          <div className="footer-links-col">
            <span className="label-eyebrow">NAVIGATION</span>
            <button className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Overview</button>
            <button className="footer-link" onClick={() => onViewChange("citizen")}>Citizen Portal</button>
            <button className="footer-link" onClick={() => onViewChange("dashboard")}>Policymaker Dashboard</button>
          </div>

          <div className="footer-links-col">
            <span className="label-eyebrow">GOVERNANCE & DPI</span>
            <span className="footer-text">Bhashini Multilingual AI</span>
            <span className="footer-text">PM Gati Shakti GIS Overlay</span>
            <span className="footer-text">CPGRAMS Data Integration</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-built">Built for Google Code for Communities 2 · Hackathon Presentation Prototype</p>
          <span className="provenance-tag">DEMONSTRATION SYSTEM · PROTOTYPE DATA ONLY</span>
        </div>
      </div>
    </footer>
  );
}

