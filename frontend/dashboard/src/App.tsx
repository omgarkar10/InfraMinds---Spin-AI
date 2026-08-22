import { useState } from "react";
import { Navbar } from "./components/navigation/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { ProblemSection } from "./components/landing/ProblemSection";
import { TransformationSection } from "./components/landing/TransformationSection";
import { ProcessSection } from "./components/landing/ProcessSection";
import { EcosystemSection } from "./components/landing/EcosystemSection";
import { AgentsSection } from "./components/landing/AgentsSection";
import { GeospatialSection } from "./components/landing/GeospatialSection";
import { PredictiveSection } from "./components/landing/PredictiveSection";
import { BricsSection } from "./components/landing/BricsSection";
import { ImpactSection } from "./components/landing/ImpactSection";
import { Footer } from "./components/landing/Footer";
import { PolicyDashboard } from "./components/PolicyDashboard";
import { CitizenChat } from "./components/CitizenChat";

type View = "landing" | "dashboard" | "citizen";

export function App() {
  const [view, setView] = useState<View>("landing");

  return (
    <>
      <Navbar view={view} onViewChange={setView} />

      {view === "dashboard" && <PolicyDashboard />}
      {view === "citizen"   && <CitizenChat />}
      {view === "landing"   && (
        <main>
          <HeroSection />
          <ProblemSection />
          <TransformationSection />
          <ProcessSection />
          <EcosystemSection />
          <AgentsSection />
          <GeospatialSection />
          <PredictiveSection />
          <BricsSection />
          <ImpactSection />
          <Footer onViewChange={setView} />
        </main>
      )}
    </>
  );
}
