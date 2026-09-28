import React, { useState } from "react";
import "../../styles/citizen.css";
import { setStoredStaffUser } from "../../services/demandService";
import { staffLogin } from "../../services/authService";
import { DEPARTMENTS } from "../../utils/departmentConfig";
import type { StaffUser } from "../../types";
import { PasswordField } from "../citizen/PasswordField";

interface StaffLoginProps {
  onLoginSuccess: (user: StaffUser) => void;
  onCancel: () => void;
  onSwitchToCitizen?: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onLoginSuccess, onCancel, onSwitchToCitizen }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department] = useState<string>(DEPARTMENTS[0]);
  const [role] = useState<StaffUser["role"]>("Department Officer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const performLoginWithUser = (user: StaffUser) => {
    setStoredStaffUser(user);
    onLoginSuccess(user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { user } = await staffLogin(email, password);
      performLoginWithUser(user as StaffUser);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (targetEmail: string, dept: string, roleName: StaffUser["role"], officerName: string) => {
    setLoading(true);
    setError("");
    const demoPassword = "securespin26";

    setEmail(targetEmail);
    setPassword(demoPassword);
    
    try {
      const { user } = await staffLogin(targetEmail, demoPassword);
      performLoginWithUser(user as StaffUser);
    } catch (err: any) {
      // Fallback for seamless local demo testing if Firebase is not seeded
      const fallbackUser: StaffUser = {
        id: "staff-" + targetEmail.split("@")[0].replace(/[^a-z0-9]/gi, ""),
        name: officerName,
        email: targetEmail,
        employeeId: "EMP-GOV-2026",
        department: dept,
        role: roleName
      };
      performLoginWithUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="citizen-portal-container">
      <div className="container">
        <div className="login-card" style={{ borderTop: "4px solid var(--col-navy)", maxWidth: "520px" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #eee", marginBottom: "20px" }}>
            <button type="button" style={{ flex: 1, padding: "12px", borderBottom: "2px solid transparent", color: "var(--col-text-muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }} onClick={onSwitchToCitizen}>Citizen Login</button>
            <button style={{ flex: 1, padding: "12px", borderBottom: "2px solid var(--col-navy)", fontWeight: 700, color: "var(--col-navy)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none" }}>Staff Login</button>
          </div>
          <div>
            <span className="label-eyebrow" style={{ color: "var(--col-navy)" }}>AUTHORIZED GOVERNMENT INTERFACE</span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>SPIN Staff Portal</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Restricted interface for municipal department officers & policymakers. Secure routing based on assigned department.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{ color: "red", fontSize: "13px", padding: "8px", background: "#ffe6e6", borderRadius: "4px" }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Official Email / Employee ID *</label>
              <input
                type="text"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. water.supply.officer@gov.in or admin@gov.in"
                required
              />
            </div>

            <PasswordField
              id="staff-password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (Default: securespin26)"
            />



            <div className="form-group" style={{ background: "#f8f9fa", border: "1px solid #ddd", padding: "12px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="checkbox" required id="captcha" />
              <label htmlFor="captcha" style={{ fontSize: "14px", cursor: "pointer" }}>I am not a robot (Captcha Verification)</label>
            </div>

            <button type="submit" className="service-card-btn" style={{ background: "var(--col-navy)", width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In to Staff Portal →"}
            </button>
          </form>

          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--col-border)" }}>
            <span className="label-eyebrow" style={{ fontSize: "10px", marginBottom: "8px", display: "block" }}>
              DEMO PRESET ACCOUNTS (ONE-CLICK DEPARTMENT SWITCH)
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px", borderColor: "var(--col-navy)", color: "var(--col-navy)", fontWeight: "bold" }}
                onClick={() => handleQuickDemoLogin("admin@gov.in", "General Administration", "Administrator", "System Administrator")}
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px", borderColor: "#6b21a8", color: "#6b21a8", fontWeight: "bold" }}
                onClick={() => handleQuickDemoLogin("ministry@nic.in", "Ministry of Housing & Urban Affairs (MoHUA)", "Policymaker", "Dr. R. K. Sharma (Joint Secretary)")}
              >
                🏛️ Ministry Policymaker
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("water.supply.officer@gov.in", "Water Supply", "Department Officer", "Water Supply Officer")}
              >
                💧 Water Supply
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("electricity.officer@gov.in", "Electricity", "Department Officer", "Electricity Officer")}
              >
                ⚡ Electricity
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("roads.transport.officer@gov.in", "Roads & Transport", "Department Officer", "Roads & Transport Officer")}
              >
                🛣️ Roads & Transport
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("sanitation.officer@gov.in", "Sanitation", "Department Officer", "Sanitation Officer")}
              >
                🧹 Sanitation
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("public.health.officer@gov.in", "Public Health", "Department Officer", "Public Health Officer")}
              >
                🏥 Public Health
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("police.law.officer@gov.in", "Police / Law & Order", "Department Officer", "Police Officer")}
              >
                👮 Police / Law
              </button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="disclaimer" style={{ fontSize: "10px" }}>
              RESTRICTED SYSTEM · GOVT PROTOCOL 2026
            </span>
            <button type="button" className="btn-outline" style={{ border: "none", fontSize: "12px" }} onClick={onCancel}>
              ← Return to Main Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
