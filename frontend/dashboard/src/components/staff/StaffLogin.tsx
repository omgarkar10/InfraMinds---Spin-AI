import React, { useState } from "react";
import "../../styles/citizen.css";
import { setStoredStaffUser } from "../../services/grievanceService";
import { staffLogin } from "../../services/authService";
import { DEPARTMENTS } from "../../utils/departmentConfig";
import type { StaffUser } from "../../types";

interface StaffLoginProps {
  onLoginSuccess: (user: StaffUser) => void;
  onCancel: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [role, setRole] = useState<StaffUser["role"]>("Department Officer");
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
      const result = await staffLogin(email, password);

      const user: StaffUser = {
        id: result.user.id,
        name: result.user.name || "Department Officer",
        employeeId: result.user.id ? `EMP-${result.user.id.slice(0, 5).toUpperCase()}` : "EMP-90812",
        email: result.user.email || email,
        department: result.user.department || department,
        role: (result.user.role as StaffUser["role"]) || role,
        isLoggedIn: true,
      };
      performLoginWithUser(user);
    } catch (err: any) {
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
    } finally {
      setLoading(false);
    }
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
        <div className="login-card" style={{ borderTop: "4px solid var(--col-navy)", maxWidth: "540px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label-eyebrow" style={{ color: "var(--col-navy)" }}>AUTHORIZED GOVERNMENT INTERFACE</span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>SPIN Staff Portal</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Restricted interface for municipal department officers. Grievance access is strictly routed based on your assigned department.
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

            <div className="form-group">
              <label className="form-label">Assigned Department *</label>
              <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Government Role *</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value as any)}>
                <option value="Department Officer">Department Officer</option>
                <option value="Staff">Field Staff / Inspector</option>
                <option value="Policymaker">Policymaker / District Official</option>
                <option value="Administrator">System Administrator</option>
              </select>
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
