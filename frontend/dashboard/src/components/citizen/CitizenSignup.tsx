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
  onSignupSuccess: (user: CitizenUser) => void;
  googlePrefill?: { name: string; email: string } | null;
}

export const CitizenSignup: React.FC<CitizenSignupProps> = ({
  onLoginClick,
  onSignupSuccess,
  googlePrefill,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);
  
  const [countries, setCountries] = useState<CountryPhoneConfig[]>([]);
  const [authConfig, setAuthConfig] = useState<any>(null);
  
  // Step 1 State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Initialize from Google prefill data if provided
  useEffect(() => {
    if (googlePrefill) {
      setName(googlePrefill.name || "");
      setEmail(googlePrefill.email || "");
      setIsGoogleFlow(true);
    }
  }, [googlePrefill]);

  // Step 2 State (OTP)
  const [otp, setOtp] = useState("");

  // Step 3 State (Password)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
        setCountries(countriesRes.countries || []);
        setAuthConfig(authRes.passwordPolicy || {});
        if (countriesRes.countries && countriesRes.countries.length > 0) {
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

  const validateStep1 = (): boolean => {
    let isValid = true;
    if (!name.trim() || !email.trim() || !dob || !termsAccepted) isValid = false;
    if (captchaChallenge?.provider === "math" && !captchaAnswer.trim()) isValid = false;

    const phoneVal = validatePhoneNumber(countryCode, phone, countries);
    setPhoneError(phoneVal.errorMessage);
    if (!phoneVal.isValid) isValid = false;

    return isValid;
  };

  const handleNextStep1 = () => {
    if (validateStep1()) {
      if (isGoogleFlow) {
        // Skip OTP and Password for Google users
        submitGoogleProfile();
      } else {
        setStep(2);
        setSubmitError(null);
      }
    }
  };

  const handleNextStep2 = () => {
    if (otp.length === 6) { // Simulate OTP validation
      setStep(3);
      setSubmitError(null);
    } else {
      setSubmitError("Please enter a valid 6-digit OTP.");
    }
  };

  const submitGoogleProfile = async () => {
    const phoneVal = validatePhoneNumber(countryCode, phone, countries);
    const normalizedPhone = phoneVal.normalizedNumber || phone;
    const user: CitizenUser = {
      id: (googlePrefill as any)?.id || "google-uid-" + Date.now(), // Real ID is populated from props or context in a real app, but we will use the one passed from the caller if it exists. Wait, googlePrefill doesn't have ID! Let's get it from the parent or just use a token.
      name: name.trim(),
      phone: normalizedPhone,
      email: email.trim(),
      dob: dob,
      isLoggedIn: true,
    };
    
    // Attempt to get the UID from the currently logged in Firebase user
    import("../../config/firebase").then(async ({ auth, db }) => {
       const currentUser = auth.currentUser;
       if (currentUser) {
          user.id = currentUser.uid;
          const { doc, setDoc } = await import("firebase/firestore");
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(userDocRef, {
            name: user.name,
            email: user.email,
            phone: user.phone,
            dob: user.dob || "",
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => console.error(err));
       }
       setStoredCitizenUser(user);
       onSignupSuccess(user);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) return handleNextStep1();
    if (step === 2) return handleNextStep2();

    // Step 3 validation
    const minLength = authConfig?.minLength || 8;
    if (password.length < minLength) {
      setPasswordError(authConfig?.error_message || `Password must be at least ${minLength} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }

    const phoneVal = validatePhoneNumber(countryCode, phone, countries);
    if (!phoneVal.normalizedNumber) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await citizenSignup({
        name: name.trim(),
        email: email.trim(),
        countryCode,
        phone: phoneVal.normalizedNumber,
        password,
        dob,
        captcha_token: captchaChallenge?.captcha_token,
        captcha_answer: captchaAnswer.trim(),
      });
      const user: CitizenUser = {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        email: result.user.email,
        dob: result.user.dob,
        isLoggedIn: true,
      };
      setStoredCitizenUser(user);
      onSignupSuccess(user);
    } catch (err: any) {
      setSubmitError(err.message || "Unable to create your account.");
      await fetchCaptcha();
      setStep(1);
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
          <h2 className="portal-heading" style={{ fontSize: "22px" }}>
            {isGoogleFlow ? "Complete Profile" : "Create Citizen Account"}
          </h2>
          <p className="portal-subtext" style={{ fontSize: "13px" }}>
            {step === 1 && "Register to raise proposals and track infrastructure issues."}
            {step === 2 && "Verify your email to continue."}
            {step === 3 && "Secure your account with a password."}
          </p>
        </div>

        {submitError && (
          <div className="error-banner" style={{ marginBottom: "20px" }}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="form-group" style={{ marginBottom: "1.2rem" }}>
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

              <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                <label className="form-label" htmlFor="email">
                  Email <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  readOnly={isGoogleFlow}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                <label className="form-label" htmlFor="dob">
                  Date of Birth <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  className="form-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
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

              {!isGoogleFlow && captchaChallenge?.provider === "math" && (
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
                className="service-card-btn service-card-btn-orange"
                disabled={!name.trim() || !email.trim() || !dob || !termsAccepted || !!phoneError || (!isGoogleFlow && captchaChallenge?.provider === "math" && !captchaAnswer.trim())}
                style={{ width: "100%", marginBottom: "20px", justifyContent: "center" }}
              >
                {isGoogleFlow ? "Complete Account" : "Continue Verification"}
              </button>
            </>
          )}

          {step === 2 && !isGoogleFlow && (
            <>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" htmlFor="otp">
                  Enter OTP sent to {email}
                </label>
                <input
                  id="otp"
                  type="text"
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP (any 6 digits for demo)"
                  maxLength={6}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(1)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="service-card-btn service-card-btn-orange"
                  disabled={otp.length !== 6}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Verify OTP
                </button>
              </div>
            </>
          )}

          {step === 3 && !isGoogleFlow && (
            <>
              <PasswordField
                id="signup-password"
                label="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                errorText={password.length > 0 ? passwordError : null}
                helpText={authConfig?.error_message || "Minimum 8 characters."}
              />

              <PasswordField
                id="signup-confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(null); }}
                errorText={confirmPassword.length > 0 ? confirmError : null}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(2)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="service-card-btn service-card-btn-orange"
                  disabled={submitting || password.length === 0 || confirmPassword.length === 0}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {submitting ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </>
          )}
          
          {!isGoogleFlow && (
            <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <span className="label-eyebrow" style={{ fontSize: "10px", textAlign: "center" }}>OR SIGN UP WITH</span>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    setSubmitError(null);
                    const res = await citizenFirebaseGoogleLogin();
                    
                    if (!res.user.phone) {
                      // First time logging in (or missing phone) -> Complete Profile
                      setName(res.user.name || "");
                      setEmail(res.user.email || "");
                      setIsGoogleFlow(true);
                      setStep(1);
                    } else {
                      // Existing fully registered user
                      const user: CitizenUser = {
                        id: res.user.id,
                        name: res.user.name,
                        phone: res.user.phone,
                        email: res.user.email,
                        isLoggedIn: true,
                      };
                      setStoredCitizenUser(user);
                      onSignupSuccess(user);
                    }
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
          )}

          <div style={{ textAlign: "center", fontSize: "13px", marginTop: "15px" }}>
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
