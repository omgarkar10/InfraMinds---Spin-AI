import { useLanguage } from "../../hooks/useLanguage";
import "./Footer.css";

interface FooterProps {
  onViewChange: (view: any) => void;
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
              {t.footer_tagline}
            </p>
          </div>

          <div className="footer-links-col">
            <span className="label-eyebrow">NAVIGATION</span>
            <button className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{t.overview}</button>
            <button className="footer-link" onClick={() => onViewChange("citizen")}>{t.citizen_label}</button>
            <button className="footer-link" onClick={() => onViewChange("dashboard")}>{t.enter_dashboard.replace(" →", "")}</button>
          </div>

          <div className="footer-links-col">
            <span className="label-eyebrow">GOVERNANCE & DPI</span>
            <span className="footer-text">Bhashini Multilingual AI</span>
            <span className="footer-text">PM Gati Shakti GIS Overlay</span>
            <span className="footer-text">CPGRAMS Data Integration</span>
            <button className="footer-link" style={{ marginTop: "8px", color: "var(--col-orange)", fontSize: "11px", fontWeight: "600" }} onClick={() => onViewChange("staff-login")}>
              🔒 Staff / Government Login
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-built">{t.footer_built}</p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button className="footer-link" style={{ fontSize: "11px", opacity: 0.8 }} onClick={() => onViewChange("staff-login")}>
              Staff Portal Login
            </button>
            <span className="provenance-tag">{t.footer_proto.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
