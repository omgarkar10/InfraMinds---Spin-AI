import React, { useState } from "react";
import "../../styles/citizen.css";
import { setStoredCitizenUser } from "../../services/grievanceService";
import { citizenLogin } from "../../services/authService";
import type { CitizenUser } from "../../types";

interface CitizenLoginProps {
  onLoginSuccess: (user: CitizenUser) => void;
  targetViewAfterLogin?: string;
  onCancel: () => void;
}

export const CitizenLogin: React.FC<CitizenLoginProps> = ({
  onLoginSuccess,
  onCancel,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    setError("");
    try {
      const result = await citizenLogin(identifier, password);

      const user: CitizenUser = {
        id: result.user.id,
        name: result.user.name || "Citizen User",
        phone: result.user.phone || identifier,
        isLoggedIn: true,
      };
      setStoredCitizenUser(user);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="citizen-portal-container">
      <div className="container">
        <div style={{ marginBottom: "14px", maxWidth: "480px", margin: "0 auto 14px auto" }}>
          <button className="btn-outline" style={{ fontSize: "12px", fontWeight: "700" }} onClick={onCancel}>
            ← Back to Home
          </button>
        </div>
        <div className="login-card">

          <div>
            <span className="label-eyebrow">GOVERNMENT SERVICE LOGIN</span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>Citizen Login</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Sign in to access SPIN citizen services, submit complaints, and track resolutions.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{ color: "red", fontSize: "13px", padding: "8px", background: "#ffe6e6", borderRadius: "4px" }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Mobile Number / Email *</label>
              <input
                type="text"
                className="form-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter mobile number or email address"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: "12px",
                    color: "var(--col-text-muted)", padding: "0",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="service-card-btn service-card-btn-orange"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Signing In…" : "Sign In →"}
            </button>
          </form>

          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: "11px", justifyContent: "center" }}
              onClick={() => {}}
            >
              New user? Create a new account
            </button>

            <button type="button" className="btn-outline" style={{ border: "none", fontSize: "12px", color: "var(--col-text-muted)" }} onClick={onCancel}>
              ← Return to Citizen Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
