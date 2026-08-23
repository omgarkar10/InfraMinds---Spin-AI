import React from "react";
import { CountryPhoneConfig } from "../../utils/phoneValidation";

interface PhoneNumberFieldProps {
  configs: CountryPhoneConfig[];
  selectedCountryCode: string;
  onCountryChange: (code: string) => void;
  phoneNumber: string;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errorText?: string | null;
}

export const PhoneNumberField: React.FC<PhoneNumberFieldProps> = ({
  configs,
  selectedCountryCode,
  onCountryChange,
  phoneNumber,
  onPhoneChange,
  errorText,
}) => {
  const selectedConfig = configs.find(c => c.code === selectedCountryCode) || configs[0];

  return (
    <div className="form-group" style={{ marginBottom: "1.5rem" }}>
      <label className="form-label" htmlFor="phone-number-input">
        Phone Number <span style={{ color: "#e53e3e" }}>*</span>
      </label>
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: "0 0 120px", position: "relative" }}>
          <select
            className="form-input"
            value={selectedCountryCode}
            onChange={(e) => onCountryChange(e.target.value)}
            aria-label="Select Country"
            style={{
              paddingLeft: "12px",
              cursor: "pointer",
              appearance: "none",
              backgroundColor: "#f7f9fa",
            }}
          >
            {configs.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} ({c.dialCode})
              </option>
            ))}
          </select>
          <span style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            fontSize: "12px",
            color: "var(--col-navy)",
            opacity: 0.5
          }}>
            ▼
          </span>
        </div>
        
        <div style={{ flex: 1, position: "relative" }}>
          <input
            id="phone-number-input"
            type="tel"
            className="form-input"
            value={phoneNumber}
            onChange={onPhoneChange}
            placeholder={selectedConfig?.placeholder || "Phone number"}
            aria-invalid={!!errorText}
            style={{
              borderColor: errorText ? "#e53e3e" : undefined,
              paddingLeft: "12px",
            }}
          />
        </div>
      </div>
      
      {errorText && (
        <p className="form-error" style={{ color: "#e53e3e", fontSize: "12px", marginTop: "4px" }} role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
};
