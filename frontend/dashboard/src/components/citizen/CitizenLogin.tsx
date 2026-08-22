import React, { useState } from "react";
import "../../styles/citizen.css";
import { setStoredCitizenUser } from "../../services/grievanceService";
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
  const [phone, setPhone] = useState("98230 41092");
  const [name, setName] = useState("Ramesh Kulkarni");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) return;
    setOtpSent(true);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const user: CitizenUser = {
      id: "cit-" + Math.floor(100 + Math.random() * 900),
      name: name || "Citizen User",
      phone: "+91 " + phone,
      isLoggedIn: true,
    };
    setStoredCitizenUser(user);
    onLoginSuccess(user);
  };

  return (
    <div className="citizen-portal-container">
      <div className="container">
        <div className="login-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label-eyebrow">GOVERNMENT SERVICE LOGIN</span>
            <span className="demo-badge-subtle" style={{ fontSize: "9px" }}>PROTOTYPE AUTHENTICATION</span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>Citizen Login</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Sign in to access SPIN citizen services, submit complaints, and track resolutions.
            </p>
          </div>

          <form onSubmit={otpSent ? handleVerify : handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isNewAccount && (
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name as per Aadhaar / ID"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <span className="form-input" style={{ width: "64px", textAlign: "center", background: "var(--col-panel)" }}>+91</span>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  required
                />
              </div>
            </div>

            {otpSent && (
              <div className="form-group">
                <label className="form-label">Enter OTP (Sent to +91 {phone}) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 4-digit OTP (e.g. 1234)"
                  required
                />
                <span className="body-sm" style={{ color: "var(--col-green)", fontSize: "11px" }}>
                  ✓ OTP dispatched successfully. Use test OTP: 1234
                </span>
              </div>
            )}

            {!otpSent ? (
              <button type="submit" className="service-card-btn service-card-btn-orange" style={{ width: "100%", justifyContent: "center" }}>
                Send OTP →
              </button>
            ) : (
              <button type="submit" className="service-card-btn service-card-btn-orange" style={{ width: "100%", justifyContent: "center" }}>
                Verify & Continue to Service →
              </button>
            )}
          </form>

          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: "11px", justifyContent: "center" }}
              onClick={() => setIsNewAccount(!isNewAccount)}
            >
              {isNewAccount ? "Already registered? Sign in" : "New user? Create a new account"}
            </button>

            {/* Alternative Prototype Integrations */}
            <div style={{ background: "var(--col-panel)", padding: "10px", borderRadius: "6px", fontSize: "11px", color: "var(--col-text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span className="label-eyebrow" style={{ fontSize: "9px" }}>ALTERNATIVE IDENTITY INTEGRATIONS (PROTOTYPE)</span>
              <span>🔒 Login via DigiLocker / Aadhaar identity verification</span>
            </div>

            <button type="button" className="btn-outline" style={{ border: "none", fontSize: "12px", color: "var(--col-text-muted)" }} onClick={onCancel}>
              ← Return to Citizen Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
