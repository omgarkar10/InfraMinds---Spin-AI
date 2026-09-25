import React, { useState } from "react";
import "../../styles/citizen.css";
import { setStoredStaffUser } from "../../services/grievanceService";
import { DEPARTMENTS } from "../../utils/departmentConfig";
import type { StaffUser } from "../../types";

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

    // Auth setup deferred to next sprint as per MVP requirements
    // Bypassing real auth and automatically logging in
    setTimeout(() => {
      const empId = `EMP-${Math.floor(10000 + Math.random() * 90000)}`;
      const fallbackUser: StaffUser = {
        id: `staff-${Date.now()}`,
        name: email ? email.split("@")[0].replace(".", " ").toUpperCase() : "OFFICER",
        employeeId: empId,
        email: email || "officer@gov.in",
        department: department,
        role: role,
        isLoggedIn: true,
      };
      performLoginWithUser(fallbackUser);
      setLoading(false);
    }, 800);
  };

  const handleQuickDemoLogin = (dept: string, roleName: StaffUser["role"], officerName: string) => {
    const demoUser: StaffUser = {
      id: `staff-demo-${dept.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      name: officerName,
      employeeId: `EMP-${dept.slice(0, 3).toUpperCase()}-402`,
      email: `${dept.toLowerCase().replace(/[^a-z0-9]/g, "")}.officer@gov.in`,
      department: dept,
      role: roleName,
      isLoggedIn: true,
    };
    performLoginWithUser(demoUser);
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
              Restricted interface for municipal department officers. Request access is strictly routed based on your assigned department.
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
                placeholder="e.g. water.officer@gov.in or EMP-90812"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>



            <div className="form-group" style={{ background: "#f8f9fa", border: "1px solid #ddd", padding: "12px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="checkbox" required id="captcha" />
              <label htmlFor="captcha" style={{ fontSize: "14px", cursor: "pointer" }}>I am not a robot (Captcha Mock)</label>
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
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("Water Supply", "Department Officer", "Er. Rajesh Patil")}
              >
                💧 Water Supply Staff
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("Electricity", "Department Officer", "Er. Sunita Rao")}
              >
                ⚡ Electricity Staff
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("Roads & Transport", "Department Officer", "Er. Vikas Gupta")}
              >
                🛣️ Roads Staff
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("Sanitation", "Department Officer", "Officer Ananya D.")}
              >
                🧹 Sanitation Staff
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("Public Health", "Department Officer", "Dr. K. S. Verma")}
              >
                🏥 Health Staff
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => handleQuickDemoLogin("Police / Law & Order", "Department Officer", "Insp. Rajesh Kumar")}
              >
                👮 Police Staff
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "4px 8px", fontSize: "11px", borderColor: "var(--col-navy)", color: "var(--col-navy)", fontWeight: "bold" }}
                onClick={() => handleQuickDemoLogin("All Departments", "Administrator", "System Administrator")}
              >
                👑 Super Admin (All Depts)
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
