import { useState } from "react";
import { useLanguage, COUNTRIES, type CountryCode } from "../../hooks/useLanguage";
import { AccessibilityModal } from "../common/AccessibilityModal";
import { HelpModal } from "../common/HelpModal";
import "../navigation/Navbar.css";

interface NavbarProps {
  view: string;
  onViewChange: (view: string) => void;
}

export function Navbar({ view, onViewChange }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { country, setCountry } = useLanguage();

  const SECTIONS = [
    { id: "overview", label: "Overview" },
    { id: "why-spin", label: "Why SPIN" },
    { id: "how-it-helps", label: "How It Helps You" },
    { id: "categories", label: "What You Can Report" },
  ];

  const scrollTo = (id: string) => {
    if (view !== "landing") {
      onViewChange("landing");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      if (id === "live") {
        onViewChange("dashboard");
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMenuOpen(false);
  };

  const handleSelectCountry = (code: CountryCode) => {
    setCountry(code);
    setLangOpen(false);
  };

  const isCitizenView = view.startsWith("citizen");

  return (
    <>
      <AccessibilityModal
        isOpen={accessibilityOpen}
        onClose={() => setAccessibilityOpen(false)}
      />

      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        onNavigate={(v) => onViewChange(v)}
      />

      <header className="gov-header-wrapper">
        {/* Top Utility Bar (UX4G Government Standard) */}
        <div className="gov-top-bar">
          <div className="gov-top-bar-inner container">
            <div className="gov-top-bar-left">
              <span className="gov-emblem-badge">🇮🇳 Government of India · Public Infrastructure Intelligence</span>
            </div>

            <div className="gov-top-bar-right">
              {/* Language / Country Selector */}
              <div className="navbar-lang-wrapper">
                <button
                  className="navbar-lang-btn"
                  onClick={() => { setLangOpen(!langOpen); setMenuOpen(false); }}
                  aria-label="Select country language"
                  aria-expanded={langOpen}
                >
                  <span className="navbar-lang-flag">{country.flag}</span>
                  <span className="navbar-lang-code">{country.languageNative}</span>
                  <span className="navbar-lang-chevron" aria-hidden="true">▾</span>
                </button>

                {langOpen && (
                  <>
                    <div className="navbar-lang-backdrop" onClick={() => setLangOpen(false)} />
                    <div className="navbar-lang-dropdown" role="menu">
                      <div className="navbar-lang-header">
                        <span className="label-eyebrow">Select Region / Language</span>
                        <span className="navbar-lang-sub">Language support — prototype</span>
                      </div>
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          className={`navbar-lang-option ${c.code === country.code ? "active" : ""}`}
                          onClick={() => handleSelectCountry(c.code)}
                          role="menuitem"
                        >
                          <span className="navbar-lang-option-flag">{c.flag}</span>
                          <div className="navbar-lang-option-text">
                            <span className="navbar-lang-option-country">{c.name}</span>
                            <span className="navbar-lang-option-lang">{c.languageNative}</span>
                          </div>
                          {c.status === "proposed" && (
                            <span className="navbar-lang-option-badge">Proposed</span>
                          )}
                          {c.code === country.code && (
                            <span className="navbar-lang-option-check">✓</span>
                          )}
                        </button>
                      ))}
                      <div className="navbar-lang-footer">
                        <span className="disclaimer">PROPOSED ARCHITECTURE · UI DEMO ONLY</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                className="gov-top-link"
                style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                onClick={() => setAccessibilityOpen(true)}
              >
                ♿ Accessibility
              </button>
              <button
                className="gov-top-link"
                style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                onClick={() => setHelpOpen(true)}
              >
                ❓ Help
              </button>
              <button
                className="navbar-cta navbar-cta-primary"
                style={{ background: "transparent", color: "var(--col-orange)", border: "1px solid var(--col-orange)" }}
                onClick={() => onViewChange("ministry-login")}
              >
                🏛️ Ministry Portal
              </button>
              <button
                className="navbar-cta navbar-cta-primary"
                onClick={() => onViewChange("staff-login")}
              >
                Staff Portal
              </button>
            </div>
          </div>
        </div>

      {/* Main Header */}
      <nav className="navbar">
        <div className="navbar-inner container">
          {/* Logo */}
          <button className="navbar-logo" onClick={() => { onViewChange("landing"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <span className="navbar-wordmark">SPIN</span>
            <div className="navbar-title-group">
              <span className="navbar-descriptor">SYMBIOTIC PUBLIC INFRASTRUCTURE NETWORK</span>
            </div>
          </button>

          {/* Desktop Links */}
          <div className="navbar-links">
            {SECTIONS.map((s) => (
              <button key={s.id} className="navbar-link" onClick={() => scrollTo(s.id)}>
                {s.label}
              </button>
            ))}
            <button className="navbar-link" onClick={() => onViewChange("approval-portal")}>
              Approval Status
            </button>
          </div>

          {/* Right Action CTAs */}
          <div className="navbar-actions">
            <button
              className={`navbar-cta ${isCitizenView ? "active" : ""}`}
              onClick={() => onViewChange("citizen")}
            >
              Citizen Portal
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button className="navbar-hamburger" onClick={() => { setMenuOpen(!menuOpen); setLangOpen(false); }} aria-label="Menu">
            <span className={`ham-line ${menuOpen ? "open" : ""}`} />
            <span className={`ham-line ${menuOpen ? "open" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="navbar-mobile-menu">
            {SECTIONS.map((s) => (
              <button key={s.id} className="navbar-mobile-link" onClick={() => scrollTo(s.id)}>
                {s.label}
              </button>
            ))}

            <button className="navbar-mobile-link" onClick={() => { onViewChange("citizen"); setMenuOpen(false); }}>
              Citizen Portal
            </button>
          </div>
        )}
      </nav>
    </header>
  </>
);
}

