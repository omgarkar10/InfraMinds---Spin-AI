import { useState, useEffect } from "react";
import "./DemoModal.css";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDashboard?: () => void;
}

interface Step {
  id: number;
  title: string;
  subtitle: string;
  techTerm: string;
  plainExplanation: string;
  badgeText: string;
  badgeType: "citizen" | "ai" | "geo" | "red" | "policy" | "hitl" | "feedback";
  content: {
    inputLabel: string;
    inputValue: string;
    processLabel: string;
    processValue: string;
    outputLabel: string;
    outputValue: string;
  };
}

const DEMO_STEPS: Step[] = [
  {
    id: 1,
    title: "Citizen Signal",
    subtitle: "Multilingual input registered from citizen",
    techTerm: "Multilingual Unstructured Intake",
    plainExplanation: "Citizens report complaints using natural speech, text, or photos in their own local language.",
    badgeText: "STAGE 01 / CITIZEN",
    badgeType: "citizen",
    content: {
      inputLabel: "RAW INPUT",
      inputValue: '"Hamare area mein pichle 3 hafton se paani nahi aa raha."',
      processLabel: "METADATA DETECTED",
      processValue: "Audio Waveform · Hindi (HI) · Cell Tower Location (Pune East)",
      outputLabel: "SIGNAL CREATED",
      outputValue: "Unverified Grievance Packet #SPIN-8942",
    },
  },
  {
    id: 2,
    title: "AI Understanding",
    subtitle: "Multilingual transcription & semantic analysis",
    techTerm: "Semantic Parsing & Entity Extraction",
    plainExplanation: "SPIN extracts key details (domain, severity, issue type) from unstructured text.",
    badgeText: "STAGE 02 / BHASHINI + GEMINI",
    badgeType: "ai",
    content: {
      inputLabel: "TRANSLATED TEXT",
      inputValue: '"Water supply has been disrupted in our area for the last 3 weeks."',
      processLabel: "AI MODEL PARSING",
      processValue: "Domain: Water Supply | Issue: Supply Disruption | Severity: High (8.5/10)",
      outputLabel: "STRUCTURED JSON",
      outputValue: '{"domain": "Water", "severity": 8.5, "duration_days": 21, "confidence": 0.94}',
    },
  },
  {
    id: 3,
    title: "Geospatial Context",
    subtitle: "Location verification & spatial joining",
    techTerm: "Geospatial Correlation",
    plainExplanation: "SPIN matches the complaint to exact GIS coordinates and infrastructure layers.",
    badgeText: "STAGE 03 / GIS + GATI SHAKTI",
    badgeType: "geo",
    content: {
      inputLabel: "LOCATION DATA",
      inputValue: "GPS: 18.5204° N, 73.8567° E (Pune East Sector 4)",
      processLabel: "SPATIAL OVERLAY",
      processValue: "Correlated with PM Gati Shakti Water Pipe Network Layer & Census Grid",
      outputLabel: "SPATIAL SIGNAL",
      outputValue: "Georeferenced Point · Ward 14 · Pipeline Segment W-402",
    },
  },
  {
    id: 4,
    title: "Red Zone Identification",
    subtitle: "Clustering grievances to detect systemic failure",
    techTerm: "Red Zone",
    plainExplanation: "An area where citizen complaint density is high relative to government infrastructure response.",
    badgeText: "STAGE 04 / PATTERN DETECTION",
    badgeType: "red",
    content: {
      inputLabel: "SIGNAL CLUSTER",
      inputValue: "37 similar water disruption complaints within 12 km² radius",
      processLabel: "THRESHOLD ANALYSIS",
      processValue: "Cluster density exceeds 3.0 grievances/km² (Baseline threshold: 0.8)",
      outputLabel: "CRITICAL ALERT",
      outputValue: "🔴 RED ZONE FLAG: Pune East Water Infrastructure Deficit",
    },
  },
  {
    id: 5,
    title: "Policy Recommendation",
    subtitle: "Synthesizing evidence into actionable policy decisions",
    techTerm: "Predictive Policy Intelligence",
    plainExplanation: "SPIN proposes specific budget reallocations based on verified citizen demand patterns.",
    badgeText: "STAGE 05 / AI RECOMMENDATION",
    badgeType: "policy",
    content: {
      inputLabel: "SYSTEM DIAGNOSTIC",
      inputValue: "Aging pipeline W-402 capacity insufficient for current population demand",
      processLabel: "BUDGET MODELING",
      processValue: "Propose ₹12 Cr reallocation from surplus maintenance fund to Ward 14 water grid",
      outputLabel: "EXECUTIVE BRIEF",
      outputValue: 'Recommendation #PR-402: "Prioritize Ward 14 Water Network Repair"',
    },
  },
  {
    id: 6,
    title: "Human Approval (HITL)",
    subtitle: "Policymaker reviews evidence before execution",
    techTerm: "Human-in-the-Loop (HITL)",
    plainExplanation: "AI suggests policy actions, but a human official makes the final binding decision.",
    badgeText: "STAGE 06 / GOVERNANCE GATE",
    badgeType: "hitl",
    content: {
      inputLabel: "EVIDENCE DOSSIER",
      inputValue: "37 verified complaints + GIS overlay + ₹12 Cr budget impact assessment",
      processLabel: "POLICYMAKER ACTION",
      processValue: "District Officer reviews evidence dossier and clicks [ APPROVE REALLOCATION ]",
      outputLabel: "DECISION AUDIT",
      outputValue: "Status: APPROVED by Official #GOV-4819 at 14:32 IST",
    },
  },
  {
    id: 7,
    title: "Citizen Feedback Loop",
    subtitle: "Closing the loop back to affected citizens",
    techTerm: "Transparent Public Feedback Loop",
    plainExplanation: "Citizens automatically receive status updates when policy action is taken on their issue.",
    badgeText: "STAGE 07 / CLOSED LOOP",
    badgeType: "feedback",
    content: {
      inputLabel: "ACTION EXECUTED",
      inputValue: "Work order issued to Water Supply Department for Ward 14 pipeline overhaul",
      processLabel: "DISPATCH NOTIFICATION",
      processValue: "Automated Bhashini message sent to all 37 reporting citizens in Hindi",
      outputLabel: "CITIZEN UPDATE",
      outputValue: '"Aapki paani ki samasya par ₹12 Cr ka karya manzoor ho gaya hai."',
    },
  },
];

export function DemoModal({ isOpen, onClose, onOpenDashboard }: DemoModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const step = DEMO_STEPS[currentStepIndex];

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (autoPlay && isOpen) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= DEMO_STEPS.length - 1) {
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [autoPlay, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="demo-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
      <div className="demo-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="demo-modal-header">
          <div className="demo-modal-header-left">
            <span className="demo-presentation-badge">HACKATHON PRESENTATION MODE</span>
            <h2 id="demo-modal-title" className="demo-modal-heading">
              SPIN in 30 Seconds: End-to-End Walkthrough
            </h2>
          </div>
          <button className="demo-modal-close" onClick={onClose} aria-label="Close presentation">
            ✕
          </button>
        </div>

        {/* Stepper indicator bar */}
        <div className="demo-stepper-bar">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.id}
              className={`demo-step-pill ${idx === currentStepIndex ? "active" : ""} ${idx < currentStepIndex ? "completed" : ""}`}
              onClick={() => { setCurrentStepIndex(idx); setAutoPlay(false); }}
              title={s.title}
            >
              <span className="demo-step-num">0{s.id}</span>
              <span className="demo-step-name">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="demo-step-card">
          <div className="demo-step-meta">
            <span className={`demo-badge-tag ${step.badgeType}`}>{step.badgeText}</span>
            <span className="demo-step-counter">Step {step.id} of 7</span>
          </div>

          <h3 className="demo-step-title">{step.title}</h3>
          <p className="demo-step-subtitle">{step.subtitle}</p>

          {/* Technical Term + Plain Language Box */}
          <div className="demo-explanation-box">
            <div className="demo-tech-term">
              <span className="label-eyebrow">Technical Term:</span>
              <strong>{step.techTerm}</strong>
            </div>
            <div className="demo-plain-lang">
              <span className="label-eyebrow">Plain-Language Rationale:</span>
              <p>"{step.plainExplanation}"</p>
            </div>
          </div>

          {/* Input / Process / Output Grid */}
          <div className="demo-io-grid">
            <div className="demo-io-card">
              <span className="demo-io-label">{step.content.inputLabel}</span>
              <div className="demo-io-value input-val">{step.content.inputValue}</div>
            </div>

            <div className="demo-io-arrow">→</div>

            <div className="demo-io-card">
              <span className="demo-io-label">{step.content.processLabel}</span>
              <div className="demo-io-value process-val">{step.content.processValue}</div>
            </div>

            <div className="demo-io-arrow">→</div>

            <div className="demo-io-card highlight">
              <span className="demo-io-label">{step.content.outputLabel}</span>
              <div className="demo-io-value output-val">{step.content.outputValue}</div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="demo-modal-footer">
          <div className="demo-footer-left">
            <button
              className={`demo-autoplay-btn ${autoPlay ? "playing" : ""}`}
              onClick={() => setAutoPlay(!autoPlay)}
            >
              {autoPlay ? "⏸ Pause Auto-Advance" : "▶ Auto-Play (30s)"}
            </button>
            <span className="demo-provenance-tag">DEMONSTRATION SYSTEM TRACE</span>
          </div>

          <div className="demo-footer-right">
            <button
              className="demo-nav-btn"
              disabled={currentStepIndex === 0}
              onClick={() => { setCurrentStepIndex((prev) => prev - 1); setAutoPlay(false); }}
            >
              ← Previous
            </button>

            {currentStepIndex < DEMO_STEPS.length - 1 ? (
              <button
                className="demo-nav-btn primary"
                onClick={() => { setCurrentStepIndex((prev) => prev + 1); setAutoPlay(false); }}
              >
                Next Step →
              </button>
            ) : (
              <button
                className="demo-nav-btn primary finish"
                onClick={() => {
                  onClose();
                  if (onOpenDashboard) onOpenDashboard();
                }}
              >
                Explore Live Policymaker Dashboard →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
