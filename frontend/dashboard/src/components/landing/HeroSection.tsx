import { useEffect, useRef } from "react";
import "./HeroSection.css";

export function HeroSection() {
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

    // Approximate India outline coordinates (normalized 0-1)
    const INDIA_POINTS = [
      [0.42,0.05],[0.48,0.03],[0.55,0.04],[0.62,0.08],[0.68,0.13],[0.72,0.18],
      [0.75,0.25],[0.77,0.32],[0.80,0.38],[0.78,0.45],[0.82,0.52],[0.83,0.58],
      [0.80,0.65],[0.76,0.72],[0.72,0.78],[0.65,0.85],[0.60,0.90],[0.55,0.95],
      [0.52,0.98],[0.50,1.00],[0.48,0.98],[0.44,0.92],[0.40,0.85],[0.35,0.78],
      [0.30,0.70],[0.25,0.62],[0.22,0.55],[0.20,0.48],[0.22,0.40],[0.25,0.33],
      [0.28,0.26],[0.32,0.20],[0.36,0.14],[0.39,0.09],[0.42,0.05]
    ];

    // Complaint dots (demo locations across India)
    const DOTS = [
      { x: 0.52, y: 0.60, label: "PUNE", domain: "WATER", active: false, t: 0, cluster: true },
      { x: 0.50, y: 0.52, label: "MUMBAI", domain: "ROAD", active: false, t: 0, cluster: false },
      { x: 0.62, y: 0.20, label: "DELHI", domain: "POWER", active: false, t: 0, cluster: false },
      { x: 0.58, y: 0.42, label: "BHOPAL", domain: "WATER", active: false, t: 0, cluster: false },
      { x: 0.45, y: 0.38, label: "JAIPUR", domain: "ROAD", active: false, t: 0, cluster: false },
      { x: 0.68, y: 0.65, label: "HYDERABAD", domain: "WATER", active: false, t: 0, cluster: false },
      { x: 0.55, y: 0.78, label: "BANGALORE", domain: "POWER", active: false, t: 0, cluster: false },
    ];

    let frame = 0;
    let animFrame: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw India outline
      ctx.beginPath();
      INDIA_POINTS.forEach(([nx, ny], i) => {
        const px = nx * w * 0.65 + w * 0.17;
        const py = ny * h * 0.85 + h * 0.05;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.015)";
      ctx.fill();

      // Animate dots appearing
      const phase = Math.floor(frame / 90);
      DOTS.forEach((dot, i) => {
        if (phase > i) {
          dot.active = true;
          dot.t = Math.min((frame - i * 90) / 60, 1);
        }
        if (!dot.active) return;

        const px = dot.x * w * 0.65 + w * 0.17;
        const py = dot.y * h * 0.85 + h * 0.05;
        const alpha = dot.t;

        // Cluster dots converge toward Pune
        let fx = px, fy = py;
        if (dot.domain === "WATER" && frame > 600) {
          const pct = Math.min((frame - 600) / 180, 1);
          const punePx = DOTS[0].x * w * 0.65 + w * 0.17;
          const punePy = DOTS[0].y * h * 0.85 + h * 0.05;
          fx = px + (punePx - px) * pct * (dot.cluster ? 0 : 0.7);
          fy = py + (punePy - py) * pct * (dot.cluster ? 0 : 0.7);
        }

        // Draw dot
        const isCluster = dot.cluster && frame > 700;
        const r = isCluster ? 6 : 3;
        const col = dot.domain === "WATER" ? "243,107,50" : dot.domain === "ROAD" ? "255,255,255" : "76,175,111";
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${alpha * (isCluster ? 0.9 : 0.55)})`;
        ctx.fill();

        // Pulse ring on cluster
        if (isCluster) {
          const pulse = (Math.sin(frame * 0.05) + 1) * 0.5;
          ctx.beginPath();
          ctx.arc(fx, fy, r + 8 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(192,57,43,${0.3 * (1 - pulse * 0.5)})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Label
          if (frame > 750) {
            const labelAlpha = Math.min((frame - 750) / 30, 1);
            ctx.fillStyle = `rgba(192,57,43,${labelAlpha})`;
            ctx.font = "500 9px Inter, sans-serif";
            ctx.letterSpacing = "0.1em";
            ctx.fillText("WATER / PUNE / HIGH DEMAND", fx + 14, fy - 2);
          }
        }
      });

      frame++;
      if (frame > 1200) frame = 0;
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
      {/* Canvas background */}
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />

      {/* Content */}
      <div className="hero-content container">
        <div className="hero-text">
          <p className="label-eyebrow hero-eyebrow">
            Digital Public Infrastructure / AI Governance
          </p>
          <h1 className="editorial-h1 hero-h1">
            Turning citizen voices<br />
            into infrastructure intelligence.
          </h1>
          <p className="body-lg hero-body">
            SPIN connects citizen grievances with AI, geospatial intelligence
            and public infrastructure data to help governments understand
            where communities need investment most.
          </p>

          {/* Pipeline strip */}
          <div className="pipeline-strip hero-pipeline" role="list">
            {["CITIZEN SIGNALS", "AI UNDERSTANDING", "GEOSPATIAL CONTEXT", "POLICY ACTION"].map((node, i, arr) => (
              <div key={node} style={{ display: "flex", alignItems: "center" }}>
                <span className="pipeline-node" role="listitem">{node}</span>
                {i < arr.length - 1 && <span className="pipeline-arrow" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-scroll-cue" aria-hidden="true">
        <span className="hero-scroll-line" />
        <span className="label-eyebrow">Scroll to explore</span>
      </div>
    </section>
  );
}
