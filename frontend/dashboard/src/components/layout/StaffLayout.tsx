import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { StaffNavbar } from "../navigation/StaffNavbar";
import type { StaffUser } from "../../types";

interface StaffLayoutProps {
  user: StaffUser | null;
  allowedRoles?: string[];
  onLogout: () => void;
}

export function StaffLayout({ user, allowedRoles, onLogout }: StaffLayoutProps) {
  const navigate = useNavigate();

  if (!user || !user.isLoggedIn) {
    return <Navigate to="/staff-login" replace />;
  }

  // Strict RBAC Role Check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If they have the wrong role, boot them out or redirect to their correct dashboard
    if (user.role === "platform_admin") return <Navigate to="/admin/platform" replace />;
    if (user.role === "state_admin") return <Navigate to="/admin/state" replace />;
    if (user.role === "district_admin") return <Navigate to="/admin/district" replace />;
    if (user.role === "Policymaker") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/staff-dashboard" replace />;
  }

  const requiresDistrict = ["field_officer", "Field Officer", "Field Inspector", "department_officer", "policymaker", "Policymaker", "district_admin"];
  const isMissingDistrict = requiresDistrict.includes(user.role) && !user.district_id;

  if (isMissingDistrict) {
    return (
      <div className="staff-layout-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--col-bg)" }}>
        <StaffNavbar user={user} onViewChange={(v) => navigate(v)} onLogout={onLogout} />
        <main className="staff-main-content" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", maxWidth: "500px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ color: "var(--col-red)", marginBottom: "12px", marginTop: 0 }}>Unassigned Jurisdiction</h2>
            <p style={{ color: "var(--col-text-mid)", marginBottom: "24px", lineHeight: "1.6" }}>
              Your account has not been assigned a specific geographic jurisdiction. Multi-tenant isolation rules require a strict district assignment to view or act on civic infrastructure data.
            </p>
            <p style={{ fontSize: "14px", color: "#666" }}>Please contact your State or Platform Administrator to provision your account.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="staff-layout-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--col-bg)" }}>
      <StaffNavbar
        user={user}
        onViewChange={(v) => navigate(v)}
        onLogout={onLogout}
      />
      <main className="staff-main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
