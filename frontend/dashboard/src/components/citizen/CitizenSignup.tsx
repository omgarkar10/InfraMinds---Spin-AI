import React, { useState, useEffect } from "react";
import { getCountriesConfig, getAuthConfig, getCaptchaChallenge, citizenSignup, citizenFirebaseGoogleLogin } from "../../services/authService";
import { setStoredCitizenUser } from "../../services/demandService";
import { CountryPhoneConfig, validatePhoneNumber } from "../../utils/phoneValidation";
import { PhoneNumberField } from "./PhoneNumberField";
import { PasswordField } from "./PasswordField";
import { TermsModal } from "./TermsModal";
import type { CitizenUser } from "../../types";
interface CitizenSignupProps {
  onLoginClick: () => void;
  onSignupSuccess: (user: any) => void;
}

export const CitizenSignup: React.FC<CitizenSignupProps> = ({
  onLoginClick,
  onSignupSuccess,
}) => {
  const [countries, setCountries] = useState<CountryPhoneConfig[]>([]);
  const [authConfig, setAuthConfig] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // CAPTCHA State
  const [captchaChallenge, setCaptchaChallenge] = useState<{
    provider: string;
    question?: string;
    captcha_token?: string;
    site_key?: string;
  } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchCaptcha = async () => {
    try {
      const chal = await getCaptchaChallenge();
      setCaptchaChallenge(chal);
      setCaptchaAnswer("");
    } catch {
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    async function loadConfigs() {
      try {
        const [countriesRes, authRes] = await Promise.all([
          getCountriesConfig(),
          getAuthConfig(),
        ]);
        setCountries(countriesRes.countries);
        setAuthConfig(authRes.passwordPolicy);
        if (countriesRes.countries.length > 0) {
          setCountryCode(countriesRes.countries[0].code);
        }
        await fetchCaptcha();
      } catch (err) {
        setSubmitError("Failed to load authentication configuration.");
      } finally {
        setLoading(false);
      }
    }
    loadConfigs();
  }, []);

  const validateAll = (): boolean => {
    let isValid = true;
    
    if (!name.trim()) isValid = false;
    if (!termsAccepted) isValid = false;

    // Validate CAPTCHA
    if (captchaChallenge?.provider === "math" && !captchaAnswer.trim()) {
      isValid = false;
    }

    // Validate Phone
    const phoneVal = validatePhoneNumber(countryCode, phone, countries);
    setPhoneError(phoneVal.errorMessage);
    if (!phoneVal.isValid) isValid = false;

    // Validate Password
    let pwdError = null;
    const minLength = authConfig?.minLength || 8;
    if (password.length < minLength) {
      pwdError = authConfig?.error_message || `Password must be at least ${minLength} characters long.`;
      isValid = false;
    }
    setPasswordError(pwdError);

    // Validate Confirm
    if (password !== confirmPassword && password.length > 0) {
      setConfirmError("Passwords do not match.");
      isValid = false;
    } else {
      setConfirmError(null);
    }

    return isValid;
  };

  // Real-time validation
  useEffect(() => {
    if (!loading) {
      validateAll();
    }
  }, [name, countryCode, phone, password, confirmPassword, termsAccepted, captchaAnswer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    const phoneVal = validatePhoneNumber(countryCode, phone, countries);
    if (!phoneVal.normalizedNumber) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await citizenSignup({
        name: name.trim(),
        countryCode,
        phone: phoneVal.normalizedNumber,
        password,
        captcha_token: captchaChallenge?.captcha_token,
        captcha_answer: captchaAnswer.trim(),
      });
      const user = {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        isLoggedIn: true,
      };
      setStoredCitizenUser(user);
      onSignupSuccess(user);
    } catch (err: any) {
      setSubmitError(err.message || "Unable to create your account.");
      await fetchCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => setTermsAccepted(true)}
      />

      <div className="login-card">
        <div className="login-header">
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            <span className="label-eyebrow">SPIN CITIZEN PORTAL</span>
          </div>
          <h2 className="portal-heading" style={{ fontSize: "22px" }}>Create Citizen Account</h2>
          <p className="portal-subtext" style={{ fontSize: "13px" }}>
            Register to raise proposals and track infrastructure issues.
          </p>
        </div>

        {submitError && (
          <div className="error-banner" style={{ marginBottom: "20px" }}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label" htmlFor="fullname">
              Full Name <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
              id="fullname"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ananya Sharma"
              required
            />
          </div>

          <PhoneNumberField
            configs={countries}
            selectedCountryCode={countryCode}
            onCountryChange={setCountryCode}
            phoneNumber={phone}
            onPhoneChange={(e) => setPhone(e.target.value)}
            errorText={phone.length > 0 ? phoneError : null}
          />

          <PasswordField
            id="signup-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorText={password.length > 0 ? passwordError : null}
            helpText={authConfig?.error_message || "Minimum 8 characters."}
          />

          <PasswordField
            id="signup-confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            errorText={confirmPassword.length > 0 ? confirmError : null}
          />

          {/* CAPTCHA / Human Verification Widget */}
          {captchaChallenge?.provider === "math" && (
            <div className="form-group" style={{ marginBottom: "1.5rem", background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--col-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="form-label" style={{ fontSize: "12px", margin: 0 }}>
                  Human Verification (CAPTCHA) <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  style={{ background: "none", border: "none", color: "var(--col-orange)", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
                >
                  🔄 Refresh Challenge
                </button>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ background: "#e2e8f0", padding: "8px 14px", borderRadius: "6px", fontWeight: 700, fontSize: "14px", color: "var(--col-navy)", letterSpacing: "1px" }}>
                  {captchaChallenge.question}
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Answer"
                  required
                  style={{ width: "100px", textAlign: "center", fontSize: "14px", fontWeight: 600 }}
                />
              </div>
            </div>
          )}

          {/* Terms & Conditions Checkbox + Clickable Modal Trigger */}
          <div className="form-group" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--col-orange)", cursor: "pointer" }}
            />
            <label htmlFor="terms" style={{ fontSize: "13px", color: "var(--col-navy)", cursor: "pointer" }}>
              I agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsTermsModalOpen(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--col-orange)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "13px",
                }}
              >
                Terms &amp; Conditions
              </button>{" "}
              <span style={{ color: "#e53e3e" }}>*</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !termsAccepted || !!phoneError || !!passwordError || !!confirmError || !name.trim() || (captchaChallenge?.provider === "math" && !captchaAnswer.trim())}
            style={{ width: "100%", marginBottom: "20px" }}
          >
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
          
          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", paddingBottom: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span className="label-eyebrow" style={{ fontSize: "10px", textAlign: "center" }}>OR SIGN UP WITH</span>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  setSubmitting(true);
                  setSubmitError(null);
                  const res = await citizenFirebaseGoogleLogin();
                  const user: CitizenUser = {
                    id: res.user.id,
                    name: res.user.name,
                    phone: res.user.phone || res.user.email,
                    isLoggedIn: true,
                  };
                  setStoredCitizenUser(user);
                  onSignupSuccess(user);
                } catch (err: any) {
                  setSubmitError(err.message || "Google authentication failed.");
                } finally {
                  setSubmitting(false);
                }
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "var(--col-navy)",
                fontWeight: 600,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </div>

          
          <div style={{ textAlign: "center", fontSize: "13px" }}>
            <span style={{ color: "var(--col-navy)", opacity: 0.7 }}>Already have an account? </span>
            <button 
              type="button" 
              onClick={onLoginClick}
              style={{ background: "none", border: "none", color: "var(--col-orange)", fontWeight: 600, cursor: "pointer" }}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
