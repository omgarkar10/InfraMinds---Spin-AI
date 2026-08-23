import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { getAuthConfig, citizenResetPassword } from "../../services/authService";
import { PasswordField } from "./PasswordField";

interface CitizenResetPasswordProps {
  phone: string;
  onBackToLogin: () => void;
  onResetSuccess: () => void;
}

export const CitizenResetPassword: React.FC<CitizenResetPasswordProps> = ({
  phone,
  onBackToLogin,
  onResetSuccess,
}) => {
  const [authConfig, setAuthConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await getAuthConfig();
        setAuthConfig(res.passwordPolicy);
      } catch (err) {
        setError("Failed to load authentication configuration.");
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, []);

  const validateAll = (): boolean => {
    let isValid = true;
    
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

  useEffect(() => {
    if (!loadingConfig) {
      validateAll();
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setLoading(true);
    setError(null);

    try {
      await citizenResetPassword({
        phone,
        password,
      });
      onResetSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
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
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>Set New Password</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Enter a new secure password for your account.
            </p>
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <PasswordField
              id="reset-password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              errorText={password.length > 0 ? passwordError : null}
              helpText={authConfig?.error_message || "Minimum 8 characters."}
            />

            <PasswordField
              id="reset-confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              errorText={confirmPassword.length > 0 ? confirmError : null}
            />

            <button
              type="submit"
              disabled={loading || !!passwordError || !!confirmError || password.length === 0}
              className="service-card-btn service-card-btn-orange"
              style={{
                width: "100%",
                justifyContent: "center",
                opacity: (!loading && !passwordError && !confirmError && password.length > 0) ? 1 : 0.5,
                cursor: (!loading && !passwordError && !confirmError && password.length > 0) ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Saving..." : "Save New Password"}
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: "13px", marginTop: "24px", marginBottom: "8px" }}>
            <button 
              type="button" 
              onClick={onBackToLogin}
              style={{ background: "none", border: "none", color: "var(--col-text-muted)", cursor: "pointer" }}
            >
              Cancel and return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
