import React, { useState } from "react";
import "../../styles/citizen.css";
import { staffLogin } from "../../services/authService";
import type { StaffUser } from "../../types";

interface MinistryLoginProps {
  onLoginSuccess: (user: StaffUser) => void;
  onCancel: () => void;
}

const MINISTRIES = [
  "Ministry of Housing & Urban Affairs (MoHUA)",
  "Ministry of Jal Shakti (Water Resources)",
  "Ministry of Road Transport & Highways (MoRTH)",
  "Ministry of Power",
  "Ministry of Finance (Department of Expenditure)",
  "NITI Aayog (Infrastructure & Urban Development)",
];

export const MinistryLogin: React.FC<MinistryLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState("admin@government.gov.in");
  const [password, setPassword] = useState("SecureSPIN2026!");
  const [ministry, setMinistry] = useState(MINISTRIES[0]);
  const [designation, setDesignation] = useState("Joint Secretary / Financial Advisor");
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
        name: result.user.name || "Ministry Official",
        employeeId: "MIN-SEC-01",
        email: result.user.email,
        department: ministry,
        role: "Policymaker",
        isLoggedIn: true,
      };
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Ministry authentication failed. Please verify official credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="citizen-portal-container">
      <div className="container">
        <div style={{ marginBottom: "14px", maxWidth: "540px", margin: "0 auto 14px auto" }}>
          <button className="btn-outline" style={{ fontSize: "12px", fontWeight: "700" }} onClick={onCancel}>
            ← Back to Home
          </button>
        </div>
        <div className="login-card" style={{ borderTop: "4px solid var(--col-orange)", maxWidth: "540px" }}>
          <div>
            <span className="label-eyebrow" style={{ color: "var(--col-orange)" }}>
              GOVERNMENT OF INDIA · CENTRAL MINISTERIAL GATEWAY
            </span>
          </div>

          <div>
            <h2 className="portal-heading" style={{ fontSize: "22px" }}>Ministry Clearance Portal</h2>
            <p className="portal-subtext" style={{ fontSize: "13px" }}>
              High-level approval interface for Union Ministry officials, Joint Secretaries, and Fiscal Advisors to review and authorize civic budget reallocations.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{ color: "red", fontSize: "13px", padding: "8px", background: "#ffe6e6", borderRadius: "4px" }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Official Ministry Email / NIC ID *</label>
              <input
                type="text"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@nic.in or admin@government.gov.in"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Security Password *</label>
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
              <label className="form-label">Ministry / Department *</label>
              <select className="form-select" value={ministry} onChange={(e) => setMinistry(e.target.value)}>
                {MINISTRIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Designation / Role *</label>
              <select className="form-select" value={designation} onChange={(e) => setDesignation(e.target.value)}>
                <option value="Joint Secretary / Financial Advisor">Joint Secretary / Financial Advisor</option>
                <option value="Director (Infrastructure Programs)">Director (Infrastructure Programs)</option>
                <option value="Under Secretary (Urban Policy)">Under Secretary (Urban Policy)</option>
                <option value="Principal Secretary">Principal Secretary</option>
              </select>
            </div>

            <button
              type="submit"
              className="service-card-btn service-card-btn-orange"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Authenticating with NIC Gateway…" : "Access Ministry Review Portal →"}
            </button>
          </form>

          <div style={{ borderTop: "1px solid var(--col-border)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="disclaimer" style={{ fontSize: "10px" }}>
              CONFIDENTIAL · CENTRAL GOVT FISCAL AUTHORIZATION
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
