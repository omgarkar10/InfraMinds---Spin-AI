import { useEffect, useRef } from "react";
import "./HeroSection.css";

interface HeroSectionProps {
  onViewChange?: (view: "landing" | "dashboard" | "citizen" | "citizen-raise" | "citizen-track") => void;
  onOpenDemoModal?: () => void;
}

export function HeroSection({ onViewChange }: HeroSectionProps) {
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

    // Outline coordinates for visualization
    const INDIA_POINTS = [
      [0.42,0.05],[0.48,0.03],[0.55,0.04],[0.62,0.08],[0.68,0.13],[0.72,0.18],
      [0.75,0.25],[0.77,0.32],[0.80,0.38],[0.78,0.45],[0.82,0.52],[0.83,0.58],
      [0.80,0.65],[0.76,0.72],[0.72,0.78],[0.65,0.85],[0.60,0.90],[0.55,0.95],
      [0.52,0.98],[0.50,1.00],[0.48,0.98],[0.44,0.92],[0.40,0.85],[0.35,0.78],
      [0.30,0.70],[0.25,0.62],[0.22,0.55],[0.20,0.48],[0.22,0.40],[0.25,0.33],
      [0.28,0.26],[0.32,0.20],[0.36,0.14],[0.39,0.09],[0.42,0.05]
    ];

    // Citizen signal points
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

      // Draw vector polygon
      ctx.beginPath();
      INDIA_POINTS.forEach(([nx, ny], i) => {
        const px = nx * w * 0.75 + w * 0.12;
        const py = ny * h * 0.82 + h * 0.08;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.strokeStyle = "rgba(15, 30, 54, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(15, 30, 54, 0.02)";
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

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${alpha * (isCluster ? 0.95 : 0.65)})`;
        ctx.fill();

        if (isCluster) {
          const pulse = (Math.sin(frame * 0.06) + 1) * 0.5;
          ctx.beginPath();
          ctx.arc(px, py, r + 10 + pulse * 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(234, 88, 12, ${0.6 * (1 - pulse * 0.4)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
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
        {/* Left Column: Hero Headline & Citizen Actions */}
        <div className="hero-left">
          <div className="hero-eyebrow-group">
            <span className="label-eyebrow tag-navy">SPIN · PUBLIC INFRASTRUCTURE NETWORK</span>
          </div>

          <h1 className="editorial-h1 hero-headline">
            Turning Citizen Voices into <span className="text-highlight">Better Public Infrastructure</span>
          </h1>

          <p className="body-lg hero-supporting-text">
            SPIN helps citizens report problems affecting their community and helps authorities understand where attention is needed.
          </p>

          {/* Primary Action Buttons for Citizens */}
          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={() => onViewChange?.("citizen-raise")}>
              Report a Problem →
            </button>
            <button className="hero-btn-secondary" onClick={() => onViewChange?.("citizen-track")}>
              Track My Grievance
            </button>

          </div>

          {/* Citizen Benefit Highlights */}
          <div className="hero-highlights">
            <div className="highlight-item">
              <span className="highlight-check">✓</span> Simple 1-minute reporting
            </div>
            <div className="highlight-item">
              <span className="highlight-check">✓</span> Speak in your local language
            </div>
            <div className="highlight-item">
              <span className="highlight-check">✓</span> Track status with live updates
            </div>
          </div>
        </div>

        {/* Right Column: Visual Signal Map */}
        <div className="hero-right">
          <div className="hero-map-frame">
            <div className="hero-map-header">
              <span className="label-eyebrow">COMMUNITY INFRASTRUCTURE MAP</span>
              <span className="status-live">● LIVE SIGNALS</span>
            </div>

            <div className="canvas-wrapper">
              <canvas ref={canvasRef} className="hero-canvas" />
            </div>

            {/* Map Legend */}
            <div className="map-legend">
              <span className="legend-title">SIGNAL LEGEND:</span>
              <div className="legend-items">
                <span className="legend-item"><span className="dot blue" /> Water Issues</span>
                <span className="legend-item"><span className="dot navy" /> Road & Transit</span>
                <span className="legend-item"><span className="dot green" /> Power & Lighting</span>
                <span className="legend-item"><span className="dot red" /> Priority Attention</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
