import { useLanguage } from "../../hooks/useLanguage";
import "./Footer.css";

interface FooterProps {
  onViewChange: (view: any, id?: string) => void;
}

export function Footer({ onViewChange }: FooterProps) {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-wordmark">SPIN</span>
            <span className="footer-descriptor">SYMBIOTIC PUBLIC INFRASTRUCTURE NETWORK</span>
            <p className="footer-tagline">
              Connecting community demand signals with municipal infrastructure decision-makers.
            </p>
          </div>

          <div className="footer-links-col">
            <span className="label-eyebrow">CITIZEN SERVICES</span>
            <button className="footer-link" onClick={() => onViewChange("citizen-raise")}>Start a Public Demand</button>
            <button className="footer-link" onClick={() => onViewChange("citizen")}>Vote on Local Demands</button>
            <button className="footer-link" onClick={() => onViewChange("citizen")}>Citizen Portal Home</button>
          </div>

        </div>

        <div className="footer-bottom">
          <p className="footer-built">Public Infrastructure Services · Built for Communities</p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button className="footer-link" style={{ fontSize: "11px", opacity: 0.8 }} onClick={() => onViewChange("staff-login")}>
              Staff Portal
            </button>
            <span className="provenance-tag">{t.footer_proto?.toUpperCase() || "CIVIC SERVICES"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
