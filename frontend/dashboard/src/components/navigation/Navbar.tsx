import { useMemo, useState, useEffect, useRef } from "react";
import { useLanguage, COUNTRIES, type CountryCode } from "../../hooks/useLanguage";
import { Shield } from "lucide-react";
import type { CitizenUser } from "../../types";
import "../navigation/Navbar.css";

interface NavbarProps {
  view: string;
  user?: CitizenUser;
  onViewChange: (view: string) => void;
}

export function Navbar({ view, user, onViewChange }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [_profileModalOpen, setProfileModalOpen] = useState(false);
  const [languageQuery, setLanguageQuery] = useState("");
  const { country, setCountry } = useLanguage();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (profileModalRef.current && !profileModalRef.current.contains(event.target as Node)) {
        setProfileModalOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setProfileModalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const query = languageQuery.trim().toLocaleLowerCase();
    if (!query) return COUNTRIES;

    return COUNTRIES.filter((option) =>
      [option.language, option.languageNative, option.name, option.code]
        .some((value) => value.toLocaleLowerCase().includes(query))
    );
  }, [languageQuery]);

  const SECTIONS = [
    { id: "home", label: "Home" },
    { id: "why-spin", label: "Why SPIN" },
    { id: "how-it-helps", label: "How It Helps You" },
    { id: "categories", label: "What You Can Demand" },
  ];

  const scrollTo = (id: string) => {
    if (id === "home") {
      onViewChange("landing");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMenuOpen(false);
      return;
    }

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
    setLanguageQuery("");
    setLangOpen(false);
  };

  const isCitizenView = view.startsWith("citizen");

  const handleLogoClick = () => {
    if (user?.isLoggedIn) {
      onViewChange("citizen");
    } else {
      onViewChange("landing");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
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
                      <span className="navbar-lang-sub">English is the default language</span>
                      <div className="navbar-lang-search-wrap">
                        <span className="navbar-lang-search-icon" aria-hidden="true">⌕</span>
                        <input
                          className="navbar-lang-search"
                          type="search"
                          value={languageQuery}
                          onChange={(event) => setLanguageQuery(event.target.value)}
                          placeholder="Search language or state"
                          aria-label="Search language or state"
                          autoFocus
                        />
                        {languageQuery && (
                          <button
                            className="navbar-lang-search-clear"
                            type="button"
                            onClick={() => setLanguageQuery("")}
                            aria-label="Clear language search"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="navbar-lang-options" role="none">
                      {filteredCountries.map((c) => (
                        <button
                          key={c.code}
                          className={`navbar-lang-option ${c.code === country.code ? "active" : ""}`}
                          onClick={() => handleSelectCountry(c.code)}
                          role="menuitem"
                        >
                          <span className="navbar-lang-option-flag">{c.flag}</span>
                          <div className="navbar-lang-option-text">
                            <span className="navbar-lang-option-country">{c.language}</span>
                            <span className="navbar-lang-option-lang">{c.languageNative} · {c.name}</span>
                          </div>
                          {c.status === "proposed" && (
                            <span className="navbar-lang-option-badge">Proposed</span>
                          )}
                          {c.code === country.code && (
                            <span className="navbar-lang-option-check">✓</span>
                          )}
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <p className="navbar-lang-empty">No matching language or state.</p>
                      )}
                    </div>
                    <div className="navbar-lang-footer">
                      <span className="disclaimer">36 INDIAN REGIONS · STATES &amp; UNION TERRITORIES</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <nav className="navbar">
        <div className="navbar-inner container">
          {/* Logo */}
          <button className="navbar-logo notranslate" onClick={handleLogoClick}>
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
          </div>

          {/* Right Action CTAs */}
          <div className="navbar-actions">
            <button
              className="navbar-link"
              style={{ fontWeight: 600, color: "var(--col-brand-orange)", marginRight: "16px", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => onViewChange("citizen")}
            >
              Dashboard
            </button>
            {user?.isLoggedIn ? (
              <div className="navbar-profile-wrapper" ref={profileMenuRef}>
                <button
                  className="navbar-profile-btn"
                  onClick={() => {
                    setProfileMenuOpen(!profileMenuOpen);
                    setMenuOpen(false);
                    setLangOpen(false);
                  }}
                  aria-label="Citizen profile menu"
                  aria-expanded={profileMenuOpen}
                >
                  <span className="navbar-profile-icon" aria-hidden="true">👤</span>
                  <span className="navbar-profile-name">{user.name || "Citizen"}</span>
                  <span className="navbar-profile-chevron" aria-hidden="true">▾</span>
                </button>

                {profileMenuOpen && (
                  <div className="navbar-profile-dropdown" role="menu">
                    <button
                      className="navbar-profile-item"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onViewChange("citizen-profile");
                      }}
                    >
                      👤 My Profile
                    </button>
                    <div className="navbar-profile-divider"></div>
                    <button
                      className="navbar-profile-item logout-item"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onViewChange("citizen-logout");
                      }}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className={`navbar-cta ${isCitizenView ? "active" : ""}`}
                onClick={() => onViewChange("citizen-login")}
              >
                Sign In
              </button>
            )}
            {!user?.isLoggedIn && (
              <button 
                className="staff-login-icon" 
                onClick={() => onViewChange("staff-login")} 
                aria-label="Staff Portal"
                style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', marginLeft: '12px' }}
              >
                <Shield size={16} />
              </button>
            )}
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

            {user?.isLoggedIn ? (
              <>
                <button className="navbar-mobile-link" onClick={() => { onViewChange("citizen-profile"); setMenuOpen(false); }}>
                  👤 My Profile
                </button>
                <button className="navbar-mobile-link" onClick={() => { onViewChange("citizen-logout"); setMenuOpen(false); }}>
                  Log Out
                </button>
              </>
            ) : (
              <button className="navbar-mobile-link" onClick={() => { onViewChange("citizen-login"); setMenuOpen(false); }}>
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

    </header>
  );
}
