import { useState } from "react";
import { LanguageProvider } from "./hooks/useLanguage";
import { Navbar } from "./components/navigation/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { ProblemSection } from "./components/landing/ProblemSection";
import { TransformationSection } from "./components/landing/TransformationSection";
import { ProcessSection } from "./components/landing/ProcessSection";
import { EcosystemSection } from "./components/landing/EcosystemSection";
import { AgentsSection } from "./components/landing/AgentsSection";
import { GeospatialSection } from "./components/landing/GeospatialSection";
import { FeedbackLoopSection } from "./components/landing/FeedbackLoopSection";
import { PredictiveSection } from "./components/landing/PredictiveSection";
import { BricsSection } from "./components/landing/BricsSection";
import { ImpactSection } from "./components/landing/ImpactSection";
import { Footer } from "./components/landing/Footer";
import { DemoModal } from "./components/landing/DemoModal";
import { PolicyDashboard } from "./components/PolicyDashboard";
import { CitizenChat } from "./components/CitizenChat";

type View = "landing" | "dashboard" | "citizen";

function AppInner() {
  const [view, setView] = useState<View>("landing");
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <>
      <Navbar
        view={view}
        onViewChange={setView}
      />

      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onOpenDashboard={() => setView("dashboard")}
      />

      {view === "dashboard" && <PolicyDashboard />}
      {view === "citizen"   && <CitizenChat />}
      {view === "landing"   && (
        <main>
          <HeroSection
            onViewChange={setView}
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
          />
          <ProblemSection />
          <TransformationSection />
          <ProcessSection />
          <EcosystemSection />
          <AgentsSection />
          <GeospatialSection />
          <FeedbackLoopSection />
          <PredictiveSection />
          <BricsSection />
          <ImpactSection />
          <Footer onViewChange={setView} />
        </main>
      )}
    </>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

