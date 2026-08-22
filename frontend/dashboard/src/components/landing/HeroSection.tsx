import { useEffect, useRef } from "react";
import "./HeroSection.css";

interface HeroSectionProps {
  onViewChange?: (view: "landing" | "dashboard" | "citizen") => void;
  onOpenDemoModal?: () => void;
}

export function HeroSection({ onViewChange, onOpenDemoModal }: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Normalized India outline coordinates
    const INDIA_POINTS = [
      [0.42,0.05],[0.48,0.03],[0.55,0.04],[0.62,0.08],[0.68,0.13],[0.72,0.18],
      [0.75,0.25],[0.77,0.32],[0.80,0.38],[0.78,0.45],[0.82,0.52],[0.83,0.58],
      [0.80,0.65],[0.76,0.72],[0.72,0.78],[0.65,0.85],[0.60,0.90],[0.55,0.95],
      [0.52,0.98],[0.50,1.00],[0.48,0.98],[0.44,0.92],[0.40,0.85],[0.35,0.78],
      [0.30,0.70],[0.25,0.62],[0.22,0.55],[0.20,0.48],[0.22,0.40],[0.25,0.33],
      [0.28,0.26],[0.32,0.20],[0.36,0.14],[0.39,0.09],[0.42,0.05]
    ];

    // Infrastructure signal points
    const DOTS = [
      { x: 0.52, y: 0.60, label: "PUNE WARD 14", domain: "WATER", active: false, t: 0, cluster: true },
      { x: 0.50, y: 0.52, label: "MUMBAI CENTRAL", domain: "ROAD", active: false, t: 0, cluster: false },
      { x: 0.62, y: 0.20, label: "DELHI NCR", domain: "POWER", active: false, t: 0, cluster: false },
      { x: 0.58, y: 0.42, label: "HYDERABAD GRID", domain: "WATER", active: false, t: 0, cluster: false },
      { x: 0.45, y: 0.38, label: "AHMEDABAD LINK", domain: "ROAD", active: false, t: 0, cluster: false },
      { x: 0.68, y: 0.65, label: "BENGALURU EAST", domain: "WATER", active: false, t: 0, cluster: false },
      { x: 0.55, y: 0.78, label: "CHENNAI METRO", domain: "POWER", active: false, t: 0, cluster: false },
    ];

    let frame = 0;
    let animFrame: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw map background grid lines
      ctx.strokeStyle = "rgba(15, 30, 54, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw India vector polygon
      ctx.beginPath();
      INDIA_POINTS.forEach(([nx, ny], i) => {
        const px = nx * w * 0.75 + w * 0.12;
        const py = ny * h * 0.82 + h * 0.08;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.strokeStyle = "rgba(15, 30, 54, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(15, 30, 54, 0.03)";
      ctx.fill();

      // Flowing signal lines & dots
      const phase = Math.floor(frame / 60);
      DOTS.forEach((dot, i) => {
        if (phase > i) {
          dot.active = true;
          dot.t = Math.min((frame - i * 60) / 40, 1);
        }
        if (!dot.active) return;

        const px = dot.x * w * 0.75 + w * 0.12;
        const py = dot.y * h * 0.82 + h * 0.08;
        const alpha = dot.t;

        const isCluster = dot.cluster && frame > 400;
        const r = isCluster ? 7 : 4;
        const col = dot.domain === "WATER" ? "2, 132, 199" : dot.domain === "ROAD" ? "15, 23, 42" : "22, 163, 74";

        // Draw dot point
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${alpha * (isCluster ? 0.95 : 0.65)})`;
        ctx.fill();

        // Pulsing red zone ring for high density cluster
        if (isCluster) {
          const pulse = (Math.sin(frame * 0.06) + 1) * 0.5;
          ctx.beginPath();
          ctx.arc(px, py, r + 10 + pulse * 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220, 38, 38, ${0.6 * (1 - pulse * 0.4)})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Label
          ctx.fillStyle = "rgba(220, 38, 38, 0.95)";
          ctx.font = "600 11px Inter, sans-serif";
          ctx.fillText("🔴 RED ZONE: PUNE WATER DISRUPTION (37 SIGNALS)", px + 16, py + 4);
        }
      });

      frame++;
      if (frame > 900) frame = 0;
      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="hero-section" id="overview">
      <div className="hero-container container">
        {/* Left Column: Hero Overview & Judge Presentation Matrix */}
        <div className="hero-left">
          <div className="hero-eyebrow-group">
            <span className="label-eyebrow tag-navy">DIGITAL PUBLIC INFRASTRUCTURE × AI</span>
            <span className="demo-badge-subtle">PROTOTYPE DEMONSTRATION</span>
          </div>

          <h1 className="editorial-h1 hero-headline">
            Turning citizen signals into infrastructure intelligence.
          </h1>

          <p className="body-lg hero-supporting-text">
            SPIN connects citizen grievances, multilingual AI, geospatial data, and government infrastructure systems to identify where public demand is highest — and where policy action is needed.
          </p>

          {/* Action CTAs */}
          <div className="hero-actions">
            {onOpenDemoModal && (
              <button className="hero-btn-primary" onClick={onOpenDemoModal}>
                ⚡ See SPIN in 30 Seconds
              </button>
            )}
            <button className="hero-btn-secondary" onClick={() => onViewChange?.("dashboard")}>
              Open Live Intelligence →
            </button>
          </div>

          {/* Pipeline flow strip */}
          <div className="pipeline-strip hero-pipeline" role="list">
            {["Citizen Signal", "AI Understanding", "Geospatial Context", "Policy Action"].map((node, i, arr) => (
              <div key={node} className="pipeline-item">
                <span className="pipeline-node">{node}</span>
                {i < arr.length - 1 && <span className="pipeline-arrow" aria-hidden="true" />}
              </div>
            ))}
          </div>

          {/* HACKATHON PRESENTATION MODE: First Viewport 6-Question Matrix */}
          <div className="judge-matrix">
            <div className="judge-matrix-header">
              <span className="label-eyebrow">FIRST-VIEWPORT SYSTEM SUMMARY (FOR JUDGES & VISITORS)</span>
            </div>
            <div className="judge-grid">
              <div className="judge-card">
                <strong className="judge-q">1. WHAT IS SPIN?</strong>
                <p className="judge-a">AI-driven infrastructure intelligence network combining DPI, Bhashini, & geospatial analytics.</p>
              </div>
              <div className="judge-card">
                <strong className="judge-q">2. WHAT PROBLEM DOES IT SOLVE?</strong>
                <p className="judge-a">Resolves fragmented grievance data so isolated complaints reveal macro infrastructure gaps.</p>
              </div>
              <div className="judge-card">
                <strong className="judge-q">3. WHAT DATA ENTERS?</strong>
                <p className="judge-a">Multilingual citizen voice, text, photo evidence, GPS metadata, and CPGRAMS records.</p>
              </div>
              <div className="judge-card">
                <strong className="judge-q">4. WHAT DOES AI DO?</strong>
                <p className="judge-a">Translates local speech, extracts entities/severity, overlays GIS, and flags Red Zones.</p>
              </div>
              <div className="judge-card">
                <strong className="judge-q">5. WHAT COMES OUT?</strong>
                <p className="judge-a">High-priority Red Zone maps & evidence-backed budget reallocation recommendations.</p>
              </div>
              <div className="judge-card">
                <strong className="judge-q">6. WHO USES THE OUTPUT?</strong>
                <p className="judge-a">District decision-makers, policymakers, and public works department heads.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map Visualization & Legend */}
        <div className="hero-right">
          <div className="hero-map-frame">
            <div className="hero-map-header">
              <span className="label-eyebrow">NATIONAL INFRASTRUCTURE INTELLIGENCE MAP</span>
              <span className="status-live">● LIVE CANVAS</span>
            </div>

            <div className="canvas-wrapper">
              <canvas ref={canvasRef} className="hero-canvas" />
            </div>

            {/* Map Legend */}
            <div className="map-legend">
              <span className="legend-title">MAP LEGEND:</span>
              <div className="legend-items">
                <span className="legend-item"><span className="dot blue" /> Citizen Signals</span>
                <span className="legend-item"><span className="dot navy" /> Infrastructure</span>
                <span className="legend-item"><span className="dot red" /> High-demand Red Zone</span>
                <span className="legend-item"><span className="dot green" /> Policy Intervention</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust / Institutional Context Strip */}
      <div className="dpi-strip">
        <div className="dpi-strip-inner container">
          <span className="dpi-strip-title">BUILT AROUND INDIA'S DIGITAL PUBLIC INFRASTRUCTURE ECOSYSTEM</span>
          <div className="dpi-badges">
            <span className="dpi-badge">Bhashini (Multilingual AI)</span>
            <span className="dpi-badge">CPGRAMS Data Layer</span>
            <span className="dpi-badge">PM Gati Shakti GIS</span>
            <span className="dpi-badge">Geospatial Data</span>
            <span className="dpi-badge">Citizen Voice Signals</span>
            <span className="dpi-badge">Gemini AI Agents</span>
          </div>
          <span className="dpi-proto-tag">Prototype / Demonstration Integration</span>
        </div>
      </div>
    </section>
  );
}

