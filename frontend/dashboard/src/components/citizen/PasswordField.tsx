import React, { useState } from "react";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  errorText?: string | null;
  helpText?: string;
  id?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "••••••••",
  required = true,
  errorText,
  helpText,
  id,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `password-field-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="form-group" style={{ marginBottom: "1.5rem" }}>
      <label htmlFor={inputId} className="form-label">
        {label} {required && <span style={{ color: "#e53e3e" }}>*</span>}
      </label>
      
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          className="form-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!errorText}
          style={{
            width: "100%",
            paddingRight: "40px",
            borderColor: errorText ? "#e53e3e" : undefined,
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--col-navy)",
            opacity: 0.6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px"
          }}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      {errorText && (
        <p className="form-error" style={{ color: "#e53e3e", fontSize: "12px", marginTop: "4px" }} role="alert">
          {errorText}
        </p>
      )}
      {!errorText && helpText && (
        <p className="form-help" style={{ color: "#718096", fontSize: "12px", marginTop: "4px" }}>
          {helpText}
        </p>
      )}
    </div>
  );
};
