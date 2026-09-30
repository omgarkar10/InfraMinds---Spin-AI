import React, { useState, useEffect } from "react";
import { fetchDistrictStaff, fetchDistrictMetrics, inviteStaff, deactivateStaff } from "../../services/adminService";

export const DistrictAdminDashboard: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await fetchDistrictMetrics();
      setMetrics(data.metrics);
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await fetchDistrictStaff();
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const role = (form.elements.namedItem("role") as HTMLSelectElement).value;
    const department_id = (form.elements.namedItem("department_id") as HTMLSelectElement).value;
    try {
      await inviteStaff({ email, role, department_id });
      alert("Invitation sent!");
      form.reset();
      loadStaff();
    } catch (err: any) {
      alert("Failed to invite: " + err.message);
    }
  };

  const handleDeactivate = async (uid: string) => {
    if (!window.confirm("Are you sure you want to deactivate this officer?")) return;
    try {
      await deactivateStaff(uid);
      loadStaff();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1 className="editorial-h2">District Admin Dashboard</h1>
      <p style={{ color: "var(--col-text-mid)", marginBottom: "24px" }}>Manage personnel and demand routing for your district.</p>

      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div className="form-card" style={{ padding: "20px", borderLeft: "4px solid #3b82f6" }}>
            <p style={{ margin: 0, color: "var(--col-text-mid)", fontSize: "0.9rem" }}>Total Demands</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem" }}>{metrics.total_grievances}</h2>
          </div>
          <div className="form-card" style={{ padding: "20px", borderLeft: "4px solid #ef4444" }}>
            <p style={{ margin: 0, color: "var(--col-text-mid)", fontSize: "0.9rem" }}>Unassigned Surveys</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem" }}>{metrics.unassigned_field_surveys}</h2>
          </div>
          <div className="form-card" style={{ padding: "20px", borderLeft: "4px solid #f59e0b" }}>
            <p style={{ margin: 0, color: "var(--col-text-mid)", fontSize: "0.9rem" }}>Pending Review</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem" }}>{metrics.pending_department_review}</h2>
          </div>
          <div className="form-card" style={{ padding: "20px", borderLeft: "4px solid #10b981" }}>
            <p style={{ margin: 0, color: "var(--col-text-mid)", fontSize: "0.9rem" }}>Escalated to Policy</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem" }}>{metrics.escalated_to_policy}</h2>
          </div>
        </div>
      )}

      <div className="form-card" style={{ marginBottom: "24px", padding: "20px" }}>
        <h3 className="editorial-h3">Invite New Staff</h3>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <input name="email" type="email" placeholder="Staff Email Address" required className="form-input" style={{ flex: 1 }} />
          <select name="role" required className="form-select" style={{ width: "200px" }}>
            <option value="">Select Role</option>
            <option value="department_officer">Department Officer</option>
            <option value="field_officer">Field Officer</option>
          </select>
          <select name="department_id" required className="form-select" style={{ width: "200px" }}>
            <option value="">Select Department</option>
            <option value="water">Water Supply</option>
            <option value="electricity">Electricity</option>
            <option value="roads">Roads & Transport</option>
            <option value="garbage">Sanitation</option>
            <option value="health">Public Health</option>
            <option value="police">Police / Law & Order</option>
            <option value="all">Cross-Department (Policy)</option>
          </select>
          <button type="submit" className="service-card-btn service-card-btn-orange" style={{ width: "auto" }}>Send Invite</button>
        </form>
      </div>

      <div className="form-card" style={{ padding: "20px" }}>
        <h3 className="editorial-h3">Staff Directory</h3>
        {loading ? <p>Loading...</p> : (
          <table style={{ width: "100%", marginTop: "16px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px" }}>Name / Email</th>
                <th style={{ padding: "12px" }}>Role</th>
                <th style={{ padding: "12px" }}>Department</th>
                <th style={{ padding: "12px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.uid || s.email} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px" }}>{s.name || s.email}</td>
                  <td style={{ padding: "12px" }}>{s.role}</td>
                  <td style={{ padding: "12px" }}>{s.department_id || "Unassigned"}</td>
                  <td style={{ padding: "12px" }}>
                    <button 
                      onClick={() => handleDeactivate(s.uid)} 
                      style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && <tr><td colSpan={4} style={{ padding: "12px", textAlign: "center", color: "#64748b" }}>No staff found in this district.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
