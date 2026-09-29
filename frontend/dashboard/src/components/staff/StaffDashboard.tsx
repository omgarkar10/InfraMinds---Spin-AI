import React, { useState, useEffect } from "react";
import "../../styles/citizen.css";
import { getStaffDemands } from "../../services/demandService";
import type { StaffUser, Proposal } from "../../types";

import { FieldOfficerDashboard } from "./FieldOfficerDashboard";
import { DepartmentOfficerDashboard } from "./DepartmentOfficerDashboard";

interface StaffDashboardProps {
  user: StaffUser;
  onNavigate: (view: string, id?: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onNavigate: _onNavigate }) => {
  const [proposals, setDemands] = useState<Proposal[]>([]);

  useEffect(() => {
    // Whenever logged in user changes, reload department-scoped proposals
    refreshData();
  }, [user.id, user.department, user.role]);

  const refreshData = () => {
    const list = getStaffDemands(user);
    setDemands(list);
  };

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
          demands={proposals} 
          onRefresh={refreshData} 
        />
      </div>
    </div>
  );
};
