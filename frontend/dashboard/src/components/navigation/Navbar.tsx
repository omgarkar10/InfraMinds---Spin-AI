import { useState } from "react";
import "../navigation/Navbar.css";

interface NavbarProps {
  view: "landing" | "dashboard" | "citizen";
  onViewChange: (view: "landing" | "dashboard" | "citizen") => void;
}

const SECTIONS = [
  { id: "overview",      label: "Overview" },
  { id: "how-it-works", label: "How It Works" },
  { id: "intelligence",  label: "Intelligence" },
  { id: "architecture", label: "Architecture" },
  { id: "impact",       label: "Impact" },
];

export function Navbar({ view, onViewChange }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    if (view !== "landing") {
      onViewChange("landing");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <button className="navbar-logo" onClick={() => { onViewChange("landing"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <span className="navbar-wordmark">SPIN</span>
          <span className="navbar-descriptor">Symbiotic Public Infrastructure Network</span>
        </button>

        {/* Desktop links */}
        <div className="navbar-links">
          {SECTIONS.map((s) => (
            <button key={s.id} className="navbar-link" onClick={() => scrollTo(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="navbar-actions">
          <button
            className={`navbar-cta ${view === "citizen" ? "active" : ""}`}
            onClick={() => onViewChange(view === "citizen" ? "landing" : "citizen")}
          >
            Citizen
          </button>
          <button
            className={`navbar-cta navbar-cta-primary ${view === "dashboard" ? "active" : ""}`}
            onClick={() => onViewChange(view === "dashboard" ? "landing" : "dashboard")}
          >
            Dashboard →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
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
            Citizen Interface
          </button>
          <button className="navbar-mobile-link navbar-mobile-cta" onClick={() => { onViewChange("dashboard"); setMenuOpen(false); }}>
            Enter Dashboard →
          </button>
        </div>
      )}
    </nav>
  );
}
