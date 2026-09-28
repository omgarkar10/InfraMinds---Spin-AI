## Goal Description
The current landing page focuses heavily on tracking grievances, reporting damage (potholes, leaks, uncollected waste), and routing issues to authorities. To align with the new schema, the landing page must pivot to a **Public Demand Measurement** model. 

This plan details the copy, component, and visual changes necessary to shift the platform's public-facing identity towards aspirational community infrastructure requests, highlighting the voting threshold mechanism.

## User Review Required
> [!NOTE]
> The Hero canvas animation currently renders dots dynamically based on hardcoded labels (e.g., "WATER", "ROAD"). I will update these to match demand statuses (e.g., "GATHERING_SUPPORT", "APPROVED"). Please review the exact labels provided in the plan to ensure they align with your branding.

## Proposed Changes

---

### Landing Page Composition

#### [MODIFY] `frontend/dashboard/src/App.tsx`
Update imports to reflect renamed components.
```diff
- import { WhatYouCanReportSection } from "./components/landing/WhatYouCanReportSection";
+ import { WhatYouCanDemandSection } from "./components/landing/WhatYouCanDemandSection";

// Inside AppInner render:
- <WhatYouCanReportSection />
+ <WhatYouCanDemandSection />
```

---

### Hero Section

#### [MODIFY] `frontend/dashboard/src/components/landing/HeroSection.tsx`
Update headlines, call-to-actions, and the animated map legend to reflect demands rather than issues.
```diff
- <h1 className="editorial-h1 hero-headline">
-   Turning Citizen Voices into <span className="text-highlight">Better Public Infrastructure</span>
- </h1>
+ <h1 className="editorial-h1 hero-headline">
+   Shape your city's future through <span className="text-highlight">Public Demand</span>
+ </h1>

- <p className="body-lg hero-supporting-text">
-   SPIN helps citizens report problems affecting their community and helps authorities understand where attention is needed.
- </p>
+ <p className="body-lg hero-supporting-text">
+   Propose public infrastructure projects, rally community votes, and help authorities measure the demand for civic improvements.
+ </p>

- <button className="hero-btn-primary" onClick={() => onViewChange?.("citizen-raise")}>
-   Propose an Improvement →
- </button>
+ <button className="hero-btn-primary" onClick={() => onViewChange?.("citizen-raise")}>
+   Start a Public Demand →
+ </button>
  
- <button className="hero-btn-secondary" onClick={() => onViewChange?.("citizen-track")}>
-   Track My Request
- </button>
+ <button className="hero-btn-secondary" onClick={() => onViewChange?.("citizen-track")}>
+   Vote on Local Demands
+ </button>

// Map Legend Updates
- <span className="legend-item"><span className="dot blue" /> Water Issues</span>
- <span className="legend-item"><span className="dot navy" /> Road & Transit</span>
- <span className="legend-item"><span className="dot green" /> Power & Lighting</span>
- <span className="legend-item"><span className="dot red" /> Priority Attention</span>
+ <span className="legend-item"><span className="dot blue" /> Gathering Support</span>
+ <span className="legend-item"><span className="dot navy" /> Feasibility Study</span>
+ <span className="legend-item"><span className="dot green" /> Approved for Budget</span>
+ <span className="legend-item"><span className="dot red" /> Trending Demands</span>
```

---

### Categories Section

#### [DELETE] `frontend/dashboard/src/components/landing/WhatYouCanReportSection.tsx`
#### [NEW] `frontend/dashboard/src/components/landing/WhatYouCanDemandSection.tsx`
Rewrite the categories to emphasize requesting positive upgrades rather than fixing damage.
```tsx
import "./WhatYouCanReportSection.css"; // Reuse existing styles

export function WhatYouCanDemandSection() {
  const categories = [
    {
      num: "01",
      title: "Public Transit",
      desc: "Request new bus stops, route expansions, or transit shelters in underserved areas.",
      commonIssues: "New bus routes · Transit shelters · Metro connectivity"
    },
    {
      num: "02",
      title: "Community Spaces",
      desc: "Demand public parks, community halls, playgrounds, or local libraries.",
      commonIssues: "Public parks · Libraries · Playground equipment"
    },
    {
      num: "03",
      title: "Road Safety",
      desc: "Propose speed bumps, pedestrian crossings, traffic signals, and street lighting.",
      commonIssues: "Pedestrian crossings · Streetlights · Speed bumps"
    },
    {
      num: "04",
      title: "Sanitation Infrastructure",
      desc: "Request public restrooms, recycling centers, or improved drainage systems.",
      commonIssues: "Public toilets · Recycling bins · Drainage expansion"
    },
    {
      num: "05",
      title: "Educational Facilities",
      desc: "Demand upgrades to local public schools, public WiFi zones, or skill centers.",
      commonIssues: "School upgrades · Public WiFi · Study centers"
    },
    {
      num: "06",
      title: "Civic Upgrades",
      desc: "Propose environmental initiatives, noise barriers, or neighborhood beautification.",
      commonIssues: "Tree planting · Noise barriers · Beautification"
    }
  ];

  return (
    <section className="categories-section" id="categories">
      <div className="container">
        <div className="categories-header">
          <span className="label-eyebrow tag-blue">INFRASTRUCTURE CATEGORIES</span>
          <h2 className="editorial-h2">
            What you can <span className="text-highlight">demand</span>
          </h2>
          <p className="body-lg categories-subtitle">
            Focus community support on the public infrastructure projects that matter most to your neighborhood.
          </p>
        </div>
        {/* Render grid matching previous design... */}
      </div>
    </section>
  );
}
```

---

### Process Workflow Section

#### [MODIFY] `frontend/dashboard/src/components/landing/HowItHelpsSection.tsx`
Update the 4-step workflow to explicitly explain the Vote Threshold mechanic to citizens.
```diff
// Step 1
- title: "REQUEST RECEIVED",
+ title: "PROPOSE AN INITIATIVE",
- desc: "Your request is securely recorded with the details, location and supporting information you provide.",
+ desc: "Submit a detailed proposal for a public infrastructure upgrade with supporting location data.",

// Step 2
- title: "REQUEST UNDERSTOOD",
+ title: "RALLY COMMUNITY VOTES",
- desc: "SPIN analyses the request to identify the issue, category, priority and relevant department.",
+ desc: "Share your demand with neighbors. Once it crosses the local vote threshold, it triggers an official review.",

// Step 3
- title: "ROUTED TO THE RIGHT AUTHORITY",
+ title: "FEASIBILITY STUDY",
- desc: "The request is matched with the appropriate department and geographic jurisdiction for review.",
+ desc: "Field Officers conduct an on-the-ground feasibility study to assess the physical and legal viability of the demand.",

// Step 4
- title: "RESOLUTION & FEEDBACK",
+ title: "POLICY ENACTMENT",
- desc: "Track progress live. Provide feedback once the department resolves the issue on the ground.",
+ desc: "Policymakers review aggregated demands and feasibility reports to allocate municipal budgets effectively."
```

## Verification Plan

### Manual Verification
1. Run `npm run dev` in `frontend/dashboard`.
2. Navigate to the landing page and verify the Hero Section renders the updated "Shape your city's future" headline and new button CTAs.
3. Scroll down and verify the animated Canvas Map legend accurately reflects the new demand states (Gathering Support, Feasibility Study, etc.).
4. Verify the "What you can demand" section displays the 6 new aspirational categories with correct text formatting.
5. Verify the "How It Works" workflow accurately displays the 4 steps, including the critical "RALLY COMMUNITY VOTES" step.
