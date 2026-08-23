import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { getCountriesConfig, citizenForgotPassword } from "../../services/authService";
import { validatePhoneNumber, CountryPhoneConfig } from "../../utils/phoneValidation";
import { PhoneNumberField } from "./PhoneNumberField";

interface CitizenForgotPasswordProps {
  onBackToLogin: () => void;
  onResetRequested: (phone: string, countryCode: string) => void;
}

export const CitizenForgotPassword: React.FC<CitizenForgotPasswordProps> = ({
  onBackToLogin,
  onResetRequested,
}) => {
  const [countries, setCountries] = useState<CountryPhoneConfig[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [countryCode, setCountryCode] = useState<string>("IN");
  const [phone, setPhone] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationResult = validatePhoneNumber(countryCode, phone, countries);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await getCountriesConfig();
        setCountries(res.countries);
        if (res.countries.length > 0) {
          setCountryCode(res.countries[0].code);
        }
      } catch (err) {
        setError("Failed to load country configuration.");
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult.isValid || !validationResult.normalizedNumber) return;

    setLoading(true);
    setError(null);

    try {
      await citizenForgotPassword({
        countryCode,
        phone: validationResult.normalizedNumber,
      });
      // Assuming success, move to reset password view
      onResetRequested(validationResult.normalizedNumber, countryCode);
    } catch (err: any) {
      setError(err.message || "Failed to initiate password reset.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="citizen-portal-container">
        <div className="container">
          <div className="login-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
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
            <span className="label-eyebrow">ACCOUNT RECOVERY</span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>Forgot Password</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Enter your mobile number to reset your password.
            </p>
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <PhoneNumberField
              configs={countries}
              selectedCountryCode={countryCode}
              onCountryChange={setCountryCode}
              phoneNumber={phone}
              onPhoneChange={(e) => setPhone(e.target.value)}
              errorText={phone.length > 0 && !validationResult.isValid ? validationResult.errorMessage : null}
            />

            <button
              type="submit"
              disabled={!validationResult.isValid || loading}
              className="service-card-btn service-card-btn-orange"
              style={{
                width: "100%",
                justifyContent: "center",
                opacity: (validationResult.isValid && !loading) ? 1 : 0.5,
                cursor: (validationResult.isValid && !loading) ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Requesting Reset..." : "Reset Password"}
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: "13px", marginTop: "24px", marginBottom: "8px" }}>
            <span style={{ color: "var(--col-navy)", opacity: 0.7 }}>Remember your password? </span>
            <button 
              type="button" 
              onClick={onBackToLogin}
              style={{ background: "none", border: "none", color: "var(--col-orange)", fontWeight: 600, cursor: "pointer" }}
            >
              Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
