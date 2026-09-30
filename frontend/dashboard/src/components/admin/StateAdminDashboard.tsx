import React, { useState, useEffect } from "react";
import { auth } from "../../config/firebase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const StateAdminDashboard: React.FC = () => {
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/admin/districts`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRoster(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/admin/provision-district`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ district_name: district, email })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to provision district admin");
      
      alert("District Admin provisioned successfully!");
      setDistrict("");
      setEmail("");
      fetchRoster(); // Refresh table
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1 className="editorial-h2">State Admin Dashboard</h1>
      <p style={{ color: "var(--col-text-mid)", marginBottom: "24px" }}>Provision and monitor District Administrators across the state.</p>

      <div className="form-card" style={{ padding: "20px", marginBottom: "32px" }}>
        <h3 className="editorial-h3">Provision District Admin</h3>
        <form onSubmit={handleProvision} style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <input 
            type="text" 
            placeholder="District Name (e.g., Pune)" 
            required 
            className="form-input" 
            value={district}
            onChange={e => setDistrict(e.target.value)}
            style={{ flex: 1 }} 
          />
          <input 
            type="email" 
            placeholder="Admin Email" 
            required 
            className="form-input" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ flex: 1 }} 
          />
          <button type="submit" className="service-card-btn service-card-btn-orange" style={{ width: "auto" }} disabled={loading}>
            {loading ? "Provisioning..." : "Provision Admin"}
          </button>
        </form>
      </div>

      <div className="form-card" style={{ padding: "20px" }}>
        <h3 className="editorial-h3">Provisioned Districts</h3>
        <div style={{ marginTop: "16px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--col-border)", color: "var(--col-text-muted)" }}>
                <th style={{ padding: "12px 8px" }}>District ID</th>
                <th style={{ padding: "12px 8px" }}>Admin Email</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "16px 8px", textAlign: "center", color: "var(--col-text-muted)" }}>
                    No district admins provisioned yet.
                  </td>
                </tr>
              ) : (
                roster.map((admin, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--col-border)" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>{admin.district_id}</td>
                    <td style={{ padding: "12px 8px" }}>{admin.email}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ 
                        background: admin.status === "active" ? "#dcfce7" : "#fee2e2", 
                        color: admin.status === "active" ? "#166534" : "#991b1b", 
                        padding: "4px 8px", borderRadius: "12px", fontSize: "12px" 
                      }}>
                        {admin.status || "active"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <button className="btn-outline" style={{ fontSize: "12px", padding: "4px 8px", color: "var(--col-red)", borderColor: "var(--col-red)" }}>
                        Revoke Access
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
