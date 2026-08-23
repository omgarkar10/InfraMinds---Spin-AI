import React, { useState } from "react";
import "../../styles/citizen.css";
import { setStoredStaffUser } from "../../services/grievanceService";
import { staffLogin } from "../../services/authService";
import type { StaffUser } from "../../types";

interface StaffLoginProps {
  onLoginSuccess: (user: StaffUser) => void;
  onCancel: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Municipal Infrastructure & Public Works");
  const [role, setRole] = useState<StaffUser["role"]>("Department Officer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await staffLogin(email, password);
      
      const user: StaffUser = {
        id: result.user.id,
        name: result.user.name || "Staff Member",
        employeeId: "N/A", // This could come from backend in future
        email: result.user.email,
        department: result.user.department || department,
        role: result.user.role as StaffUser["role"],
        isLoggedIn: true,
      };
      setStoredStaffUser(user);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="citizen-portal-container">
      <div className="container">
        <div className="login-card" style={{ borderTop: "4px solid var(--col-navy)", maxWidth: "520px" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label-eyebrow" style={{ color: "var(--col-navy)" }}>AUTHORIZED GOVERNMENT INTERFACE</span>
            <span className="demo-badge-subtle" style={{ fontSize: "9px" }}>DEMO STAFF AUTH</span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>SPIN Staff Portal</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              Restricted government interface for municipal officials, department engineers, and policy decision-makers.
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
                placeholder="officer@government.gov.in or Employee ID"
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
              <label className="form-label">Department *</label>
              <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="Municipal Infrastructure & Public Works">Municipal Infrastructure & Public Works</option>
                <option value="Water Supply & Sanitation Board">Water Supply & Sanitation Board</option>
                <option value="State Power Distribution Corp">State Power Distribution Corp</option>
                <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Government Role *</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value as any)}>
                <option value="Department Officer">Department Officer</option>
                <option value="Policymaker">Policymaker / District Official</option>
                <option value="Staff">Field Staff / Inspector</option>
                <option value="Administrator">System Administrator</option>
              </select>
            </div>

            <button type="submit" className="service-card-btn" style={{ background: "var(--col-navy)", width: "100%", justifyContent: "center" }}>
              Sign In to Staff Portal →
            </button>
          </form>

          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
