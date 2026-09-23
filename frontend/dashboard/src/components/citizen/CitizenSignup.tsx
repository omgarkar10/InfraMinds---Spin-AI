import React, { useState, useEffect } from "react";
import { getCountriesConfig, getAuthConfig, getCaptchaChallenge, citizenSignup } from "../../services/authService";
import { setStoredCitizenUser } from "../../services/grievanceService";
import { CountryPhoneConfig, validatePhoneNumber } from "../../utils/phoneValidation";
import { PhoneNumberField } from "./PhoneNumberField";
import { PasswordField } from "./PasswordField";
import { TermsModal } from "./TermsModal";

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
            Register to raise grievances and track infrastructure issues.
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
