import React from "react";
import "../../styles/citizen.css";
import type { StaffUser } from "../../types";

import { FieldOfficerDashboard } from "./FieldOfficerDashboard";
import { DepartmentOfficerDashboard } from "./DepartmentOfficerDashboard";

import { PolicyDashboard } from "../PolicyDashboard";
import { DistrictAdminDashboard } from "../admin/DistrictAdminDashboard";
import { StateAdminDashboard } from "../admin/StateAdminDashboard";
import { PlatformAdminDashboard } from "../admin/PlatformAdminDashboard";

interface StaffDashboardProps {
  user: StaffUser;
  onNavigate: (view: string, id?: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user }) => {
  switch (user.role) {
    case "department_officer": 
      return (
        <div className="citizen-portal-container" style={{ paddingTop: "32px", minHeight: "calc(100vh - 60px)" }}>
          <div className="container">
            <DepartmentOfficerDashboard user={user} />
          </div>
        </div>
      );
    case "field_officer": 
    case "Field Officer":
    case "Field Inspector":
      return <FieldOfficerDashboard user={user} />;
    case "policymaker":
    case "Policymaker":
      return <PolicyDashboard />;
    case "district_admin": 
      return <DistrictAdminDashboard />;
    case "state_admin": 
      return <StateAdminDashboard />;
    case "platform_admin": 
      return <PlatformAdminDashboard />;
    default:
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Dashboard not found for role: {user.role}</h2>
        </div>
      );
  }
};
