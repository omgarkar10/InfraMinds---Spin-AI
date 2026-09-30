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
