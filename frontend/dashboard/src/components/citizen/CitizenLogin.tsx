import React, { useState } from "react";
import "../../styles/citizen.css";
import { setStoredCitizenUser } from "../../services/grievanceService";
import type { CitizenUser } from "../../types";
import { SUPPORTED_COUNTRIES } from "../../utils/phoneCountries";
import { validatePhoneNumber, getCountryByCode, sanitizePhoneNumber } from "../../utils/phoneValidation";

interface CitizenLoginProps {
  onLoginSuccess: (user: CitizenUser) => void;
  targetViewAfterLogin?: string;
  onCancel: () => void;
}

export const CitizenLogin: React.FC<CitizenLoginProps> = ({
  onLoginSuccess,
  onCancel,
}) => {
  const [countryCode, setCountryCode] = useState<string>("IN");
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);

  const currentCountry = getCountryByCode(countryCode);
  const validationResult = validatePhoneNumber(countryCode, phone);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Restrict input to digits only
    const sanitized = sanitizePhoneNumber(e.target.value);
    setPhone(sanitized);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountryCode(e.target.value);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // Independent server-side style validation check before proceeding
    const check = validatePhoneNumber(countryCode, phone);
    if (!check.isValid || !check.normalizedNumber) {
      return;
    }
    setOtpSent(true);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validatePhoneNumber(countryCode, phone);
    if (!check.isValid || !check.normalizedNumber) {
      return;
    }

    const user: CitizenUser = {
      id: "cit-" + Math.floor(100 + Math.random() * 900),
      name: name.trim() || "Citizen User",
      phone: check.normalizedNumber,
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
              Sign in to access SPIN citizen services.
            </p>
          </div>

          <form onSubmit={otpSent ? handleVerify : handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Full Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            {/* Country-Specific Mobile Number Section */}
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {/* Country Code Dropdown */}
                <select
                  className="form-select"
                  value={countryCode}
                  onChange={handleCountryChange}
                  disabled={otpSent}
                  style={{
                    width: "170px",
                    flexShrink: 0,
                    fontWeight: "500",
                  }}
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.dialCode})
                    </option>
                  ))}
                </select>

                {/* National Phone Number Input */}
                <div style={{ flex: 1 }}>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={otpSent}
                    placeholder={`e.g. ${currentCountry.placeholder}`}
                    maxLength={currentCountry.maxLength}
                    style={{
                      borderColor: phone && !validationResult.isValid ? "var(--col-red)" : undefined,
                    }}
                    required
                  />
                </div>
              </div>

              {/* Dynamic Validation & Error Messages */}
              {!otpSent && phone && !validationResult.isValid && validationResult.errorMessage && (
                <span style={{ fontSize: "11px", color: "var(--col-red)", marginTop: "4px", display: "block" }}>
                  ⚠️ {validationResult.errorMessage}
                </span>
              )}
              {!otpSent && validationResult.isValid && (
                <span style={{ fontSize: "11px", color: "var(--col-green)", marginTop: "4px", display: "block" }}>
                  ✓ Valid {currentCountry.name} mobile number ({validationResult.normalizedNumber})
                </span>
              )}
            </div>

            {otpSent && (
              <div className="form-group">
                <label className="form-label">
                  OTP (Sent to {validationResult.normalizedNumber || `${currentCountry.dialCode}${phone}`}) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                />
              </div>
            )}

            {!otpSent ? (
              <button
                type="submit"
                disabled={!validationResult.isValid}
                className="service-card-btn service-card-btn-orange"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  opacity: validationResult.isValid ? 1 : 0.5,
                  cursor: validationResult.isValid ? "pointer" : "not-allowed",
                }}
              >
                Send OTP
              </button>
            ) : (
              <button
                type="submit"
                className="service-card-btn service-card-btn-orange"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Verify & Continue
              </button>
            )}
          </form>

          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span className="label-eyebrow" style={{ fontSize: "10px" }}>USE ANOTHER LOGIN METHOD</span>

            <div style={{ background: "var(--col-panel)", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "var(--col-text-mid)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontWeight: "600", color: "var(--col-navy)" }}>🆔 Aadhaar / DigiLocker Integration</div>
              <div style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>
                Future Prototype Option — Identity integration coming in future release (Not active in demo).
              </div>
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
