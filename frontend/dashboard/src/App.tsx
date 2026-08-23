import { useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { LanguageProvider } from "./hooks/useLanguage";
import { Navbar } from "./components/navigation/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { WhySpinSection } from "./components/landing/WhySpinSection";
import { HowItHelpsSection } from "./components/landing/HowItHelpsSection";
import { WhatYouCanReportSection } from "./components/landing/WhatYouCanReportSection";
import { FinalCtaSection } from "./components/landing/FinalCtaSection";
import { Footer } from "./components/landing/Footer";
import { DemoModal } from "./components/landing/DemoModal";
import { PolicyDashboard } from "./components/PolicyDashboard";

/* Citizen & Staff Portal Imports */
import { CitizenPortalHome } from "./components/citizen/CitizenPortalHome";
import { CitizenLogin } from "./components/citizen/CitizenLogin";
import { RaiseGrievanceForm } from "./components/citizen/RaiseGrievanceForm";
import { TrackGrievances } from "./components/citizen/TrackGrievances";
import { GrievanceDetail } from "./components/citizen/GrievanceDetail";
import { StaffLogin } from "./components/staff/StaffLogin";
import { StaffDashboard } from "./components/staff/StaffDashboard";
import { ApprovalPortal } from "./components/approval/ApprovalPortal";
import { MinistryLogin } from "./components/ministry/MinistryLogin";
import { MinistryReviewPortal } from "./components/ministry/MinistryReviewPortal";
import { getStoredCitizenUser, getStoredStaffUser, clearStoredCitizenUser } from "./services/grievanceService";
import type { CitizenUser, StaffUser } from "./types";

export type ViewState =
  | "landing"
  | "dashboard"
  | "citizen"
  | "citizen-login"
  | "citizen-raise"
  | "citizen-track"
  | "citizen-detail"
  | "staff-login"
  | "staff-dashboard"
  | "approval-portal"
  | "ministry-login"
  | "ministry-portal";

function AppInner() {
  const [view, setView] = useState<ViewState>("landing");
  const [targetViewAfterLogin, setTargetViewAfterLogin] = useState<string>("citizen-raise");
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string>("");

  const [citizenUser, setCitizenUser] = useState<CitizenUser>(getStoredCitizenUser());
  const [staffUser, setStaffUser] = useState<StaffUser>(getStoredStaffUser());
  const [ministryUser, setMinistryUser] = useState<StaffUser>(getStoredStaffUser());
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  /* Navigation handler with Auth Protection */
  const handleNavigate = (newView: string, extraId?: string) => {
    if (extraId) {
      setSelectedGrievanceId(extraId);
    }

    if (newView === "citizen-logout") {
      clearStoredCitizenUser();
      setCitizenUser({ id: "cit-001", name: "", phone: "", isLoggedIn: false });
      setView("citizen-login");
      return;
    }

    // Require Citizen Login BEFORE "Raise Grievance" or "Track Grievances"
    if ((newView === "citizen-raise" || newView === "citizen-track") && !citizenUser.isLoggedIn) {
      setTargetViewAfterLogin(newView);
      setView("citizen-login");
      return;
    }

    // Require Staff Login BEFORE Staff Dashboard
    if (newView === "staff-dashboard" && !staffUser.isLoggedIn) {
      setView("staff-login");
      return;
    }

    // Require Ministry Login BEFORE Ministry Portal
    if (newView === "ministry-portal" && !ministryUser.isLoggedIn) {
      setView("ministry-login");
      return;
    }

    setView(newView as ViewState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Citizen Login Success Callback */
  const handleCitizenLoginSuccess = (user: CitizenUser) => {
    setCitizenUser(user);
    handleNavigate(targetViewAfterLogin);
  };

  /* Staff Login Success Callback */
  const handleStaffLoginSuccess = (user: StaffUser) => {
    setStaffUser(user);
    setView("staff-dashboard");
  };

  /* Ministry Login Success Callback */
  const handleMinistryLoginSuccess = (user: StaffUser) => {
    setMinistryUser(user);
    setView("ministry-portal");
  };

  return (
    <>
      <Navbar
        view={view}
        onViewChange={(v) => handleNavigate(v)}
      />

      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onOpenDashboard={() => handleNavigate("dashboard")}
      />

      {/* VIEW ROUTING */}
      {view === "dashboard" && <PolicyDashboard onNavigate={(v) => handleNavigate(v)} />}

      {/* APPROVAL STATUS PORTAL */}
      {view === "approval-portal" && (
        <ApprovalPortal onNavigate={(v) => handleNavigate(v)} />
      )}

      {/* MINISTRY PORTAL VIEWS */}
      {view === "ministry-login" && (
        <MinistryLogin
          onLoginSuccess={handleMinistryLoginSuccess}
          onCancel={() => setView("landing")}
        />
      )}

      {view === "ministry-portal" && (
        <MinistryReviewPortal
          user={ministryUser}
          onNavigate={(v) => handleNavigate(v)}
        />
      )}

      {/* CITIZEN PORTAL VIEWS */}
      {view === "citizen" && (
        <CitizenPortalHome
          user={citizenUser}
          onNavigate={(v) => handleNavigate(v)}
        />
      )}

      {view === "citizen-login" && (
        <CitizenLogin
          onLoginSuccess={handleCitizenLoginSuccess}
          targetViewAfterLogin={targetViewAfterLogin}
          onCancel={() => setView("citizen")}
        />
      )}

      {view === "citizen-raise" && (
        <RaiseGrievanceForm
          user={citizenUser}
          onNavigate={(v, id) => handleNavigate(v, id)}
        />
      )}

      {view === "citizen-track" && (
        <TrackGrievances
          user={citizenUser}
          onNavigate={(v, id) => handleNavigate(v, id)}
        />
      )}

      {view === "citizen-detail" && (
        <GrievanceDetail
          user={citizenUser}
          grievanceId={selectedGrievanceId}
          onNavigate={(v) => handleNavigate(v)}
        />
      )}

      {/* STAFF PORTAL VIEWS */}
      {view === "staff-login" && (
        <StaffLogin
          onLoginSuccess={handleStaffLoginSuccess}
          onCancel={() => setView("landing")}
        />
      )}

      {view === "staff-dashboard" && (
        <StaffDashboard
          user={staffUser}
          onNavigate={(v) => handleNavigate(v)}
        />
      )}

      {/* LANDING PAGE VIEW */}
      {view === "landing" && (
        <main>
          <HeroSection
            onViewChange={(v) => handleNavigate(v)}
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
          />
          <WhySpinSection />
          <HowItHelpsSection />
          <WhatYouCanReportSection />
          <FinalCtaSection onViewChange={(v) => handleNavigate(v)} />
          <Footer onViewChange={(v) => handleNavigate(v)} />
        </main>
      )}
    </>
  );
}


export function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
  
  return (
    <APIProvider apiKey={apiKey}>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </APIProvider>
  );
}


