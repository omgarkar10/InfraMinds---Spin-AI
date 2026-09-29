import { useState, useRef, useEffect } from "react";
import type { StaffUser } from "../../types";
import "../navigation/Navbar.css";

interface StaffNavbarProps {
  user: StaffUser;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export function StaffNavbar({ user, onViewChange, onLogout }: StaffNavbarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case "Policymaker": return "var(--col-blue)";
      case "Field Inspector":
      case "Field Officer": return "var(--col-orange)";
      default: return "var(--col-green)";
    }
  };

  return (
    <header className="gov-header-wrapper" style={{ zIndex: 1000, position: "relative" }}>
      {/* Top Utility Bar (UX4G Government Standard) */}
      <div className="gov-top-bar">
        <div className="gov-top-bar-inner container">
          <div className="gov-top-bar-left">
            <span className="gov-emblem-badge" style={{ color: "var(--col-orange)" }}>
              🔒 RESTRICTED STAFF PORTAL
            </span>
          </div>
          <div className="gov-top-bar-right">
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
              {user.department} Operations
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <nav className="navbar" style={{ background: "var(--col-surface)", borderBottom: "1px solid var(--col-border)" }}>
        <div className="navbar-inner container">
          {/* Logo */}
          <div className="navbar-logo notranslate" style={{ cursor: "default" }}>
            <span className="navbar-wordmark" style={{ color: "var(--col-navy)" }}>SPIN</span>
            <div className="navbar-title-group">
              <span className="navbar-descriptor" style={{ color: "var(--col-navy)" }}>STAFF WORKSPACE</span>
            </div>
          </div>

          {/* Center Links (Tab-like routing could be added here later) */}
          <div className="navbar-links">
            {user.role === "Policymaker" && (
              <button className="navbar-link" onClick={() => onViewChange("dashboard")}>
                Analytics Map
              </button>
            )}
            <button className="navbar-link active" onClick={() => onViewChange("staff-dashboard")}>
              {(user.role === "Field Inspector" || user.role === "Field Officer") ? "My Investigations" : "Demand Queue"}
            </button>
          </div>

          {/* Right Profile Dropdown */}
          <div className="navbar-actions">
            <div className="navbar-profile-wrapper" ref={profileMenuRef}>
              <button
                className="navbar-profile-btn"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={{ background: "var(--col-bg)", border: "1px solid var(--col-border)" }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "8px" }}>
                  <span className="navbar-profile-name" style={{ color: "var(--col-navy)" }}>{user.name}</span>
                  <span style={{ fontSize: "10px", color: getRoleBadgeColor(), fontWeight: 700 }}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <span className="navbar-profile-icon" aria-hidden="true" style={{ background: "var(--col-border)" }}>🏢</span>
                <span className="navbar-profile-chevron" aria-hidden="true" style={{ color: "var(--col-navy)" }}>▾</span>
              </button>

              {profileMenuOpen && (
                <div className="navbar-profile-dropdown" role="menu" style={{ right: 0, marginTop: "8px" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--col-border)", background: "var(--col-bg)" }}>
                    <div style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>Employee ID</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--col-navy)", fontFamily: "monospace" }}>{user.employeeId}</div>
                  </div>
                  <button
                    className="navbar-profile-item logout-item"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    style={{ color: "var(--col-red)" }}
                  >
                    Secure Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
