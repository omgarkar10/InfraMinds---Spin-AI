import React, { useState, useEffect } from "react";
import { auth } from "../../config/firebase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const DEPARTMENT_LABELS: Record<string, string> = {
  "water": "Water & Sanitation",
  "electricity": "Electricity & Power",
  "roads": "Roads & Transport",
  "garbage": "Waste & Garbage",
  "drainage": "Sewage & Drainage",
  "other": "Other / General"
};

import type { StaffUser } from "../../types";

export const DistrictAdminDashboard: React.FC<{ user: StaffUser }> = ({ user }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged((user) => {
      if (user) {
        loadStaff();
        loadMetrics();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadMetrics = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/admin/district/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMetrics(await res.json());
      }
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/admin/district/staff`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setStaff(await res.json());
      }
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
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/admin/district/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email, role, department_id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to provision staff");
      
      alert("Invitation sent successfully!");
      form.reset();
      loadStaff();
    } catch (err: any) {
      alert("Failed to invite: " + err.message);
    }
  };

  const handleToggleSuspend = async (uid: string, currentStatus: string) => {
    const action = currentStatus === "suspended" ? "restore" : "suspend";
    if (!window.confirm(`Are you sure you want to ${action} this officer?`)) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/admin/district/staff/${uid}/suspend`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to toggle suspension");
      loadStaff();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1 className="editorial-h2">{user.district_display_name ? `${user.district_display_name} Administration` : 'District Administration Dashboard'}</h1>
      <p style={{ color: "var(--col-text-mid)", marginBottom: "24px" }}>Manage personnel and demand routing for your district.</p>

      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div className="form-card" style={{ padding: "20px", borderLeft: "4px solid #3b82f6" }}>
            <p style={{ margin: 0, color: "var(--col-text-mid)", fontSize: "0.9rem" }}>Total Demands</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem" }}>{metrics.total_demands}</h2>
          </div>
          <div className="form-card" style={{ padding: "20px", borderLeft: "4px solid #ef4444" }}>
            <p style={{ margin: 0, color: "var(--col-text-mid)", fontSize: "0.9rem" }}>Unassigned Surveys</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem" }}>{metrics.unassigned_surveys}</h2>
          </div>
          <div className="form-card" style={{ padding: "20px", borderLeft: "4px solid #f59e0b" }}>
            <p style={{ margin: 0, color: "var(--col-text-mid)", fontSize: "0.9rem" }}>Pending Review</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem" }}>{metrics.pending_review}</h2>
          </div>
          <div className="form-card" style={{ padding: "20px", borderLeft: "4px solid #10b981" }}>
            <p style={{ margin: 0, color: "var(--col-text-mid)", fontSize: "0.9rem" }}>Escalated to Policy</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem" }}>{metrics.escalated_policy}</h2>
          </div>
        </div>
      )}

      <div className="form-card" style={{ marginBottom: "24px", padding: "20px" }}>
        <h3 className="editorial-h3">Invite New Staff</h3>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
          <input name="email" type="email" placeholder="Staff Email Address" required className="form-input" style={{ flex: 1, minWidth: "200px" }} />
          <select name="role" required className="form-select" style={{ width: "200px" }}>
            <option value="">Select Role</option>
            <option value="policymaker">Policymaker</option>
            <option value="department_officer">Department Officer</option>
            <option value="field_officer">Field Officer</option>
          </select>
          <select name="department_id" required className="form-select" style={{ width: "200px" }}>
            <option value="">Select Department</option>
            <option value="water">Water & Sanitation</option>
            <option value="electricity">Electricity & Power</option>
            <option value="roads">Roads & Transport</option>
            <option value="garbage">Waste & Garbage</option>
            <option value="drainage">Sewage & Drainage</option>
            <option value="other">Other / General</option>
          </select>
          <button type="submit" className="service-card-btn service-card-btn-orange" style={{ width: "auto" }}>Send Invite</button>
        </form>
      </div>

      <div className="form-card" style={{ padding: "20px" }}>
        <h3 className="editorial-h3">Staff Directory</h3>
        {loading ? <p>Loading...</p> : (
          <div style={{ marginTop: "16px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "var(--col-text-muted)" }}>
                  <th style={{ padding: "12px 8px" }}>Name / Email</th>
                  <th style={{ padding: "12px 8px" }}>Role</th>
                  <th style={{ padding: "12px 8px" }}>Department</th>
                  <th style={{ padding: "12px 8px" }}>Status</th>
                  <th style={{ padding: "12px 8px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.uid || s.email} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 500 }}>{s.name || s.email}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ fontSize: "12px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "12px", color: "#475569" }}>
                        {s.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px" }}>{DEPARTMENT_LABELS[s.department_id] || s.department_id || "Unassigned"}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ 
                        background: s.status === "suspended" ? "#fee2e2" : "#dcfce7", 
                        color: s.status === "suspended" ? "#991b1b" : "#166534", 
                        padding: "4px 8px", borderRadius: "12px", fontSize: "12px" 
                      }}>
                        {s.status || "active"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <button 
                        onClick={() => handleToggleSuspend(s.uid, s.status)} 
                        className="btn-outline"
                        style={{ 
                          fontSize: "12px", padding: "4px 8px", 
                          color: s.status === "suspended" ? "var(--col-green)" : "var(--col-red)", 
                          borderColor: s.status === "suspended" ? "var(--col-green)" : "var(--col-red)" 
                        }}
                      >
                        {s.status === "suspended" ? "Restore" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && <tr><td colSpan={5} style={{ padding: "12px", textAlign: "center", color: "#64748b" }}>No staff found in this district.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
