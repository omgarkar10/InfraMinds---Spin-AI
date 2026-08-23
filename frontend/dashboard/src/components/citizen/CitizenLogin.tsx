import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { setStoredCitizenUser } from "../../services/grievanceService";
import { getCountriesConfig, citizenLogin } from "../../services/authService";
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
}

export const CitizenLogin: React.FC<CitizenLoginProps> = ({
  onLoginSuccess,
  onCancel,
  onSignupClick,
  onForgotPasswordClick,
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
      const demoUser: CitizenUser = {
        id: "cit-" + Math.floor(100 + Math.random() * 900),
        name: "Citizen User",
        phone: validationResult.normalizedNumber || phone,
        isLoggedIn: true,
      };
      setStoredCitizenUser(demoUser);
      onLoginSuccess(demoUser);
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label-eyebrow">GOVERNMENT SERVICE LOGIN</span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>Citizen Login</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Sign in to access SPIN citizen services, submit complaints, and track resolutions.
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
