import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { setStoredCitizenUser } from "../../services/demandService";
import { getCountriesConfig, citizenLogin, citizenFirebaseGoogleLogin } from "../../services/authService";
import type { CitizenUser } from "../../types";
import { validatePhoneNumber, CountryPhoneConfig } from "../../utils/phoneValidation";
import { PhoneNumberField } from "./PhoneNumberField";
import { PasswordField } from "./PasswordField";

interface CitizenLoginProps {
  onLoginSuccess: (user: CitizenUser) => void;
  targetViewAfterLogin?: string;
  onCancel: () => void;
  onSignupClick?: () => void;
  onForgotPasswordClick?: () => void;
  onSwitchToStaff?: () => void;
}

export const CitizenLogin: React.FC<CitizenLoginProps> = ({
  onLoginSuccess,
  onCancel,
  onSignupClick,
  onForgotPasswordClick,
  onSwitchToStaff,
}) => {
  const [countries, setCountries] = useState<CountryPhoneConfig[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [countryCode, setCountryCode] = useState<string>("IN");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationResult = validatePhoneNumber(countryCode, phone, countries);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await getCountriesConfig();
        setCountries(res.countries || []);
        if (res.countries && res.countries.length > 0) {
          setCountryCode(res.countries[0].code);
        }
      } catch (err) {
        const fallbackConfig: CountryPhoneConfig[] = [
          {
            code: "IN",
            name: "India",
            flag: "🇮🇳",
            dialCode: "+91",
            minLength: 10,
            maxLength: 10,
            pattern: "^[6-9]\\d{9}$",
            placeholder: "9876543210",
          },
        ];
        setCountries(fallbackConfig);
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult.isValid || !validationResult.normalizedNumber || !password) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await citizenLogin({
        countryCode,
        phone: validationResult.normalizedNumber,
        password,
      });

      const user: CitizenUser = {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        isLoggedIn: true,
      };

      setStoredCitizenUser(user);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Invalid phone number or password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="citizen-portal-container">
        <div className="container">
          <div className="login-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <p>Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="citizen-portal-container">
      <div className="container">
        <div className="login-card">
          <div style={{ display: "flex", borderBottom: "1px solid #eee", marginBottom: "20px" }}>
            <button style={{ flex: 1, padding: "12px", borderBottom: "2px solid var(--col-orange)", fontWeight: 700, color: "var(--col-orange)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none" }}>Citizen Login</button>
            <button type="button" style={{ flex: 1, padding: "12px", borderBottom: "2px solid transparent", color: "var(--col-text-muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }} onClick={onSwitchToStaff}>Staff Login</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label-eyebrow">GOVERNMENT SERVICE LOGIN</span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>Citizen Login</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Sign in to access SPIN citizen services, submit community demands, and track resolutions.
            </p>
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <PhoneNumberField
              configs={countries}
              selectedCountryCode={countryCode}
              onCountryChange={setCountryCode}
              phoneNumber={phone}
              onPhoneChange={(e) => setPhone(e.target.value)}
              errorText={phone.length > 0 && !validationResult.isValid ? validationResult.errorMessage : null}
            />

            <PasswordField
              id="login-password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-10px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={onForgotPasswordClick}
                style={{ background: "none", border: "none", color: "var(--col-navy)", fontSize: "12px", textDecoration: "underline", cursor: "pointer" }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={!validationResult.isValid || !password || loading}
              className="service-card-btn service-card-btn-orange"
              style={{
                width: "100%",
                justifyContent: "center",
                opacity: validationResult.isValid && password && !loading ? 1 : 0.5,
                cursor: validationResult.isValid && password && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: "13px", marginTop: "24px", marginBottom: "16px" }}>
            <span style={{ color: "var(--col-navy)", opacity: 0.7 }}>Don't have an account? </span>
            <button
              type="button"
              onClick={onSignupClick}
              style={{ background: "none", border: "none", color: "var(--col-orange)", fontWeight: 600, cursor: "pointer" }}
            >
              Create Citizen Account
            </button>
          </div>

          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span className="label-eyebrow" style={{ fontSize: "10px" }}>USE ANOTHER LOGIN METHOD</span>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError(null);
                  const res = await citizenFirebaseGoogleLogin();
                  const user: CitizenUser = {
                    id: res.user.id,
                    name: res.user.name,
                    phone: res.user.phone || res.user.email,
                    isLoggedIn: true,
                  };
                  setStoredCitizenUser(user);
                  onLoginSuccess(user);
                } catch (err: any) {
                  setError(err.message || "Google authentication failed.");
                } finally {
                  setLoading(false);
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

            <div style={{ background: "var(--col-panel)", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "var(--col-text-mid)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontWeight: "600", color: "var(--col-navy)" }}>🆔 Aadhaar / DigiLocker Integration</div>
              <div style={{ fontSize: "11px", color: "var(--col-text-muted)" }}>
                Future Prototype Option — Identity integration coming in future release (Not active in demo).
              </div>
            </div>

            <button type="button" className="btn-outline" style={{ border: "none", fontSize: "12px", color: "var(--col-text-muted)", marginTop: "8px" }} onClick={onCancel}>
              ← Return to Citizen Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
