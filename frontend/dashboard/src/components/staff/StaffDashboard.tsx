import React from "react";
import "../../styles/citizen.css";
import type { StaffUser } from "../../types";

import { FieldOfficerDashboard } from "./FieldOfficerDashboard";
import { DepartmentOfficerDashboard } from "./DepartmentOfficerDashboard";

interface StaffDashboardProps {
  user: StaffUser;
  onNavigate: (view: string, id?: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onNavigate: _onNavigate }) => {
  // proposals state removed

  // No effect needed for DepartmentOfficerDashboard anymore as it fetches its own data

  if (user.role === "Field Inspector" || user.role === "Field Officer") {
    return <FieldOfficerDashboard user={user} />;
  }

  if (user.role === "Policymaker") {
    // If they navigated here manually, we can redirect or show a message.
    // However, App.tsx handles the actual dashboard rendering. We'll just null return or prompt them.
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Routing to Analytics Map...</h2>
      </div>
    );
  }

  // Department Officer & Administrator 
  return (
    <div className="citizen-portal-container" style={{ paddingTop: "32px", minHeight: "calc(100vh - 60px)" }}>
      <div className="container">
        <DepartmentOfficerDashboard 
          user={user} 
        />
      </div>
    </div>
  );
};
