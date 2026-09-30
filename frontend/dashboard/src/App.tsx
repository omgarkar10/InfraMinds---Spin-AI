import { useState, useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { LanguageProvider } from "./hooks/useLanguage";
import { Navbar } from "./components/navigation/Navbar";
import { StaffNavbar } from "./components/navigation/StaffNavbar";
import { HeroSection } from "./components/landing/HeroSection";
import { WhySpinSection } from "./components/landing/WhySpinSection";
import { HowItHelpsSection } from "./components/landing/HowItHelpsSection";
import { WhatYouCanDemandSection } from "./components/landing/WhatYouCanDemandSection";
import { FinalCtaSection } from "./components/landing/FinalCtaSection";
import { Footer } from "./components/landing/Footer";
import { DemoModal } from "./components/landing/DemoModal";
import { PolicyDashboard } from "./components/PolicyDashboard";
import { ChatbotWidget } from "./components/ChatbotWidget";
import { BackButton } from "./components/navigation/BackButton";

/* Citizen & Staff Portal Imports */
import { CitizenPortalHome } from "./components/citizen/CitizenPortalHome";
import { CitizenLogin } from "./components/citizen/CitizenLogin";
import { CitizenSignup } from "./components/citizen/CitizenSignup";
import { CitizenForgotPassword } from "./components/citizen/CitizenForgotPassword";
import { CitizenResetPassword } from "./components/citizen/CitizenResetPassword";
import { CreateDemandForm } from "./components/citizen/CreateDemandForm";
import { TrackDemands } from "./components/citizen/TrackDemands";
import { DemandDetail } from "./components/citizen/DemandDetail";
import { CitizenProfile } from "./components/citizen/CitizenProfile";
import { StaffLogin } from "./components/staff/StaffLogin";
import { StaffDashboard } from "./components/staff/StaffDashboard";
import { getStoredCitizenUser, getStoredStaffUser, clearStoredCitizenUser } from "./services/demandService";
import type { CitizenUser, StaffUser } from "./types";

export type ViewState =
  | "landing"
  | "dashboard"
  | "citizen"
  | "citizen-login"
  | "citizen-signup"
  | "citizen-forgot-password"
  | "citizen-reset-password"
  | "citizen-raise"
  | "citizen-track"
  | "citizen-detail"
  | "citizen-profile"
  | "staff-login"
  | "staff-dashboard";

function AppInner() {
  const [view, setView] = useState<ViewState>("landing");
  const [targetViewAfterLogin, setTargetViewAfterLogin] = useState<string>("citizen");
  const [selectedDemandId, setSelectedDemandId] = useState<string>("");

  // For Reset Password flow
  const [resetPhone, setResetPhone] = useState<string>("");

  const [citizenUser, setCitizenUser] = useState<CitizenUser>(
    (getStoredCitizenUser() as CitizenUser) || { id: "", name: "", phone: "", email: "", isLoggedIn: false }
  );
  const [staffUser, setStaffUser] = useState<StaffUser>(
    (getStoredStaffUser() as StaffUser) || { id: "", name: "", employeeId: "", email: "", department: "", role: "Department Officer", isLoggedIn: false }
  );
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [googlePrefill, setGooglePrefill] = useState<{ name: string; email: string } | null>(null);

  const VIEW_TO_URL: Record<string, string> = {
    "landing": "",
    "citizen": "feed",
    "citizen-login": "login",
    "citizen-signup": "signup",
    "citizen-forgot-password": "forgot-password",
    "citizen-reset-password": "reset-password",
    "citizen-raise": "propose",
    "citizen-track": "track",
    "citizen-detail": "detail", 
    "citizen-profile": "profile",
    "staff-login": "staff-login",
    "staff-dashboard": "staff-dashboard",
    "dashboard": "admin-dashboard",
  };

  const URL_TO_VIEW: Record<string, string> = Object.entries(VIEW_TO_URL).reduce((acc, [view, url]) => {
    acc[url] = view;
    return acc;
  }, {} as Record<string, string>);

  // Sync with Browser URL
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const demandQuery = searchParams.get("demand");
      
      if (demandQuery) {
        setSelectedDemandId(demandQuery);
        setView("citizen-detail");
        // Update URL to canonical path without reloading
        window.history.replaceState({}, "", `/detail/${demandQuery}`);
        return;
      }

      const path = window.location.pathname.substring(1) || "";
      const parts = path.split("/");
      const urlView = parts[0];
      const newView = URL_TO_VIEW[urlView] || "landing";
      if (parts[1]) setSelectedDemandId(parts[1]);
      
      // Prevent bypassing auth by manually typing URL
      if (["citizen-raise", "citizen-track", "citizen-profile"].includes(newView) && !citizenUser.isLoggedIn) {
        setView("citizen-login");
      } else if (["staff-dashboard", "dashboard"].includes(newView) && !staffUser.isLoggedIn) {
        setView("staff-login");
      } else {
        setView(newView as ViewState);
      }
    };
    
    // Initialize view based on current URL on mount
    if (window.location.pathname !== "/" || window.location.search) {
       handlePopState();
    }
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [citizenUser.isLoggedIn, staffUser.isLoggedIn]);

  /* Navigation handler with Citizen Auth Protection */
  const handleNavigate = (newView: string, extraId?: string) => {
    if (extraId) {
      setSelectedDemandId(extraId);
    }

    if (newView === "citizen-logout") {
      clearStoredCitizenUser();
      setCitizenUser({ id: "", name: "", phone: "", email: "", isLoggedIn: false });
      handleNavigate("citizen-login");
      return;
    }

    // Require Citizen Login BEFORE "Propose Initiative" or "Track Proposals" or Profile
    if ((newView === "citizen-raise" || newView === "citizen-track" || newView === "citizen-profile") && !citizenUser.isLoggedIn) {
      setTargetViewAfterLogin(newView);
      handleNavigate("citizen-login");
      return;
    }

    // Require Staff Login BEFORE Staff Dashboard
    if ((newView === "staff-dashboard" || newView === "dashboard") && !staffUser.isLoggedIn) {
      handleNavigate("staff-login");
      return;
    }

    const baseUrl = VIEW_TO_URL[newView] || newView;
    const url = extraId ? `/${baseUrl}/${extraId}` : `/${baseUrl}`;
    if (window.location.pathname !== url) {
       window.history.pushState({}, "", url);
    }
    setView(newView as ViewState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateBack = () => {
    window.history.back();
  };

  /* Citizen Login Success Callback */
  const handleCitizenLoginSuccess = (user: CitizenUser) => {
    setCitizenUser(user);
    const pendingDemandId = localStorage.getItem("pending_vote_demand_id");
    
    if (pendingDemandId) {
      handleNavigate("citizen-detail", pendingDemandId);
      // Component will handle auto-voting upon mounting
    } else {
      const destination = targetViewAfterLogin || "citizen";
      setTargetViewAfterLogin("citizen");
      const baseUrl = VIEW_TO_URL[destination] || destination;
      const url = `/${baseUrl}`;
      // Replace the login view in history so 'Back' doesn't go to login
      window.history.replaceState({}, "", url);
      setView(destination as ViewState);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* Staff Login Success Callback */
  const handleStaffLoginSuccess = (user: StaffUser) => {
    setStaffUser(user);
    const destination = user.role === "Policymaker" ? "dashboard" : "staff-dashboard";
    const baseUrl = VIEW_TO_URL[destination] || destination;
    window.history.replaceState({}, "", `/${baseUrl}`);
    setView(destination as ViewState);
  };

  const handleStaffLogout = () => {
    import("./services/demandService").then(({ clearStoredStaffUser }) => clearStoredStaffUser());
    localStorage.removeItem("staff_token");
    setStaffUser({ id: "", email: "", isLoggedIn: false, name: "", employeeId: "", department: "", role: "Department Officer" } as StaffUser);
    handleNavigate("landing");
  };

  const isCitizenPortalView = ["citizen", "citizen-raise", "citizen-track", "citizen-detail", "citizen-profile"].includes(view);

  return (
    <>
      {view !== "landing" && (
        <BackButton onClick={handleNavigateBack} label="Back" />
      )}
      
      {(view === "staff-dashboard" || view === "dashboard") && staffUser.id ? (
        <StaffNavbar
          user={staffUser as StaffUser}
          onViewChange={handleNavigate}
          onLogout={handleStaffLogout}
        />
      ) : isCitizenPortalView ? null : (
        <Navbar
          view={view}
          user={citizenUser.isLoggedIn ? citizenUser : undefined}
          onViewChange={handleNavigate}
        />
      )}

      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onOpenDashboard={() => handleNavigate("dashboard")}
      />

      {/* VIEW ROUTING */}
      {view === "dashboard" && <PolicyDashboard />}

      {/* CITIZEN PORTAL VIEWS */}
      {view === "citizen" && (
        <CitizenPortalHome
          user={citizenUser}
          onNavigate={(v, id) => handleNavigate(v, id)}
        />
      )}

      {view === "citizen-login" && (
        <CitizenLogin
          onLoginSuccess={handleCitizenLoginSuccess}
          targetViewAfterLogin={targetViewAfterLogin}
          onCancel={() => setView("landing")}
          onSignupClick={() => { setGooglePrefill(null); setView("citizen-signup"); }}
          onForgotPasswordClick={() => setView("citizen-forgot-password")}
          onSwitchToStaff={() => setView("staff-login")}
          onGoogleNewUser={(prefill) => {
            setGooglePrefill(prefill);
            setView("citizen-signup");
          }}
        />
      )}

      {view === "citizen-signup" && (
        <CitizenSignup
          onLoginClick={() => { setGooglePrefill(null); setView("citizen-login"); }}
          onSignupSuccess={handleCitizenLoginSuccess}
          googlePrefill={googlePrefill}
        />
      )}

      {view === "citizen-forgot-password" && (
        <CitizenForgotPassword
          onBackToLogin={() => setView("citizen-login")}
          onResetRequested={(phone) => {
            setResetPhone(phone);
            setView("citizen-reset-password");
          }}
        />
      )}

      {view === "citizen-reset-password" && (
        <CitizenResetPassword
          phone={resetPhone}
          onBackToLogin={() => setView("citizen-login")}
          onResetSuccess={() => setView("citizen-login")}
        />
      )}

      {view === "citizen-raise" && (
        <CreateDemandForm
          user={citizenUser}
          onNavigate={(v, id) => handleNavigate(v, id)}
        />
      )}

      {view === "citizen-track" && (
        <TrackDemands
          user={citizenUser}
          onNavigate={(v, id) => handleNavigate(v, id)}
        />
      )}

      {view === "citizen-detail" && (
        <DemandDetail
          user={citizenUser}
          DemandId={selectedDemandId}
          onNavigate={handleNavigate}
        />
      )}

      {view === "citizen-profile" && (
        <CitizenProfile
          user={citizenUser}
          onNavigate={(v, id) => handleNavigate(v, id)}
        />
      )}

      {view === "staff-login" && (
        <StaffLogin
          onLoginSuccess={handleStaffLoginSuccess}
          onCancel={() => setView("landing")}
          onSwitchToCitizen={() => setView("citizen-login")}
        />
      )}

      {view === "staff-dashboard" && (
        <StaffDashboard
          user={staffUser}
          onNavigate={handleNavigate}
        />
      )}

      {/* LANDING PAGE VIEW */}
      {view === "landing" && (
        <main>
          <HeroSection
            onViewChange={handleNavigate}
          />
          <WhySpinSection />
          <HowItHelpsSection />
          <WhatYouCanDemandSection />
          <FinalCtaSection onViewChange={handleNavigate} />
          <Footer onViewChange={handleNavigate} />
        </main>
      )}

      {/* Global Floating Chatbot Widget */}
      <ChatbotWidget />
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


