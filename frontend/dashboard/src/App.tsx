import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import { StaffLayout } from "./components/layout/StaffLayout";
import { StaffLogin } from "./components/staff/StaffLogin";
import { StaffDashboard } from "./components/staff/StaffDashboard";
import { DistrictAdminDashboard } from "./components/admin/DistrictAdminDashboard";
import { StateAdminDashboard } from "./components/admin/StateAdminDashboard";
import { PlatformAdminDashboard } from "./components/admin/PlatformAdminDashboard";
import { getStoredCitizenUser, getStoredStaffUser, clearStoredCitizenUser, voteForDemand } from "./services/demandService";
import type { CitizenUser, StaffUser } from "./types";

function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();

  const [citizenUser, setCitizenUser] = useState<CitizenUser>(
    (getStoredCitizenUser() as CitizenUser) || { id: "", name: "", phone: "", email: "", isLoggedIn: false }
  );
  const [staffUser, setStaffUser] = useState<StaffUser>(
    (getStoredStaffUser() as StaffUser) || { id: "", name: "", employeeId: "", email: "", department: "", role: "Department Officer", isLoggedIn: false }
  );
  
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [googlePrefill, setGooglePrefill] = useState<{ name: string; email: string } | null>(null);

  /* Citizen Login Success Callback */
  const handleCitizenLoginSuccess = (user: CitizenUser) => {
    setCitizenUser(user);
    const pendingDemandId = localStorage.getItem("pending_vote_demand_id");
    
    if (pendingDemandId) {
      // Auto-dispatch vote
      voteForDemand(pendingDemandId).catch(console.error).finally(() => {
        localStorage.removeItem("pending_vote_demand_id");
        navigate(`/demand/${pendingDemandId}`, { replace: true });
      });
    } else {
      const dest = new URLSearchParams(location.search).get("redirect") || "/feed";
      navigate(dest, { replace: true });
    }
  };

  const handleStaffLoginSuccess = (user: StaffUser) => {
    setStaffUser(user);
    if (user.role === "district_admin") {
      navigate("/admin/district", { replace: true });
    } else if (user.role === "state_admin") {
      navigate("/admin/state", { replace: true });
    } else if (user.role === "platform_admin") {
      navigate("/admin/platform", { replace: true });
    } else if (user.role === "Policymaker" || user.role === "platform_admin") {
      navigate("/admin-dashboard", { replace: true });
    } else {
      navigate("/staff-dashboard", { replace: true });
    }
  };

  const handleStaffLogout = () => {
    import("./services/demandService").then(({ clearStoredStaffUser }) => clearStoredStaffUser());
    localStorage.removeItem("staff_token");
    setStaffUser({ id: "", email: "", isLoggedIn: false, name: "", employeeId: "", department: "", role: "Department Officer" } as StaffUser);
    navigate("/", { replace: true });
  };

  const handleCitizenLogout = () => {
    clearStoredCitizenUser();
    setCitizenUser({ id: "", name: "", phone: "", email: "", isLoggedIn: false });
    navigate("/login");
  };

  // Guard Components
  const RequireCitizenAuth = ({ children }: { children: JSX.Element }) => {
    if (!citizenUser.isLoggedIn) {
      return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }
    return children;
  };

  const RequireStaffAuth = ({ children }: { children: JSX.Element }) => {
    if (!staffUser.isLoggedIn) {
      return <Navigate to="/staff-login" replace />;
    }
    return children;
  };

  const isLanding = location.pathname === "/";
  const isStaffView = location.pathname.startsWith("/staff-") || location.pathname.startsWith("/admin-");

  // Redirect Stranded Staff
  if (isLanding && staffUser.isLoggedIn && staffUser.role) {
    if (staffUser.role === "platform_admin") return <Navigate to="/admin/platform" replace />;
    if (staffUser.role === "state_admin") return <Navigate to="/admin/state" replace />;
    if (staffUser.role === "district_admin") return <Navigate to="/admin/district" replace />;
    if (staffUser.role === "Policymaker") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/staff-dashboard" replace />;
  }

  return (
    <>
      {(!isLanding && !isStaffView) && <BackButton onClick={() => navigate(-1)} label="Back" />}
      
      {!isLanding ? null : (
        <Navbar
          view="landing"
          user={citizenUser.isLoggedIn ? citizenUser : undefined}
          onViewChange={(v) => {
             if (v === "citizen-logout") handleCitizenLogout();
             else if (v === "citizen") navigate("/feed");
             else if (v === "citizen-raise") navigate("/propose");
             else if (v === "citizen-track") navigate("/track");
             else if (v === "citizen-profile") navigate("/profile");
             else if (v === "staff-login") navigate("/staff-login");
             else navigate("/");
          }}
        />
      )}

      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onOpenDashboard={() => navigate("/admin-dashboard")}
      />

      <Routes>
        <Route path="/" element={
          <main className="landing-main">
            <HeroSection />
            <WhySpinSection />
            <HowItHelpsSection />
            <WhatYouCanDemandSection />
            <FinalCtaSection onViewChange={(v) => navigate(v === 'citizen' ? '/feed' : '/')} />
            <Footer onViewChange={(v) => navigate(v === 'citizen' ? '/feed' : '/')} />
            <ChatbotWidget />
          </main>
        } />
        
        {/* Public Citizen Routes */}
        <Route path="/feed" element={<CitizenPortalHome user={citizenUser} />} />
        <Route path="/demand/:demand_id" element={<DemandDetail user={citizenUser} />} />
        
        <Route path="/login" element={<CitizenLogin onLoginSuccess={handleCitizenLoginSuccess} targetViewAfterLogin="/feed" onCancel={() => navigate("/")} onSignupClick={() => { setGooglePrefill(null); navigate("/signup"); }} onForgotPasswordClick={() => navigate("/forgot-password")} onSwitchToStaff={() => navigate("/staff-login")} onGoogleNewUser={(prefill) => { setGooglePrefill(prefill); navigate("/signup"); }} />} />
        <Route path="/signup" element={<CitizenSignup onSignupSuccess={handleCitizenLoginSuccess} onLoginClick={() => navigate("/login")} />} />
        <Route path="/forgot-password" element={<CitizenForgotPassword />} />
        <Route path="/reset-password" element={<CitizenResetPassword />} />
        
        {/* Protected Citizen Routes */}
        <Route path="/propose" element={<RequireCitizenAuth><CreateDemandForm user={citizenUser} onNavigate={(view, id) => navigate(id ? `/demand/${id}` : "/feed")} /></RequireCitizenAuth>} />
        <Route path="/track" element={<RequireCitizenAuth><TrackDemands user={citizenUser} /></RequireCitizenAuth>} />
        <Route path="/profile" element={<RequireCitizenAuth><CitizenProfile user={citizenUser} onNavigate={(view, id) => { if(view === "citizen-logout") handleCitizenLogout(); else if (view === "citizen-detail" && id) navigate(`/demand/${id}`); else navigate("/feed"); }} /></RequireCitizenAuth>} />

        {/* Staff Routes */}
        <Route path="/staff-login" element={<StaffLogin onLoginSuccess={handleStaffLoginSuccess} onCancel={() => navigate("/")} />} />
        
        <Route element={<StaffLayout user={staffUser as StaffUser} onLogout={handleStaffLogout} />}>
          <Route path="/staff-dashboard" element={<RequireStaffAuth><StaffDashboard user={staffUser as StaffUser} onNavigate={(v) => navigate(v)} /></RequireStaffAuth>} />
          <Route path="/admin-dashboard" element={<RequireStaffAuth><PolicyDashboard /></RequireStaffAuth>} />
          <Route path="/admin/district" element={<RequireStaffAuth><DistrictAdminDashboard /></RequireStaffAuth>} />
          <Route path="/admin/state" element={<RequireStaffAuth><StateAdminDashboard /></RequireStaffAuth>} />
          <Route path="/admin/platform" element={<RequireStaffAuth><PlatformAdminDashboard /></RequireStaffAuth>} />
        </Route>
      </Routes>
    </>
  );
}

export function App() {
  return (
    <Router>
      <LanguageProvider>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
          <AppInner />
        </APIProvider>
      </LanguageProvider>
    </Router>
  );
}
