import { SectionBase } from "./SectionBase";
import "./GeospatialSection.css";

export function GeospatialSection() {
  return (
    <SectionBase id="intelligence" number="06" label="Geospatial Intelligence">
      <div className="geo-layout">
        {/* Heading */}
        <div className="geo-heading reveal">
          <h2 className="editorial-h2">
            From individual complaints<br />to geographic patterns.
          </h2>
        </div>

        {/* India map SVG + clustering animation */}
        <div className="geo-visual reveal animate-reveal-delay-1">
          <svg
            viewBox="0 0 500 560"
            className="geo-map"
            aria-label="Simplified map of India showing complaint clusters"
          >
            {/* India outline - simplified */}
            <path
              d="M210 25 L240 15 L275 20 L310 40 L340 65 L360 90 L375 125 L390 160 L400 190 L390 225 L410 260 L415 290 L400 325 L380 360 L360 390 L325 425 L300 450 L275 475 L260 499 L250 510 L240 499 L220 460 L200 425 L175 390 L150 350 L125 310 L110 275 L100 240 L110 200 L125 165 L140 130 L155 100 L170 70 L190 45 Z"
              fill="rgba(255,255,255,0.015)"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />

            {/* Complaint dots */}
            <g className="geo-dots">
              {/* Pune cluster - main */}
              <circle cx="260" cy="300" r="5" fill="rgba(192,57,43,0.8)" className="geo-dot-pulse" />
              <circle cx="265" cy="308" r="3" fill="rgba(192,57,43,0.5)" />
              <circle cx="255" cy="295" r="3" fill="rgba(192,57,43,0.5)" />
              <circle cx="270" cy="294" r="2.5" fill="rgba(192,57,43,0.4)" />
              <circle cx="251" cy="310" r="2.5" fill="rgba(192,57,43,0.4)" />
              {/* Pulse ring */}
              <circle cx="260" cy="300" r="14" fill="none" stroke="rgba(192,57,43,0.25)" strokeWidth="1" className="geo-pulse-ring" />

              {/* Mumbai */}
              <circle cx="248" cy="318" r="3" fill="rgba(255,255,255,0.35)" />
              <circle cx="252" cy="325" r="2" fill="rgba(255,255,255,0.25)" />

              {/* Delhi */}
              <circle cx="270" cy="100" r="3" fill="rgba(76,175,111,0.5)" />
              <circle cx="265" cy="108" r="2" fill="rgba(76,175,111,0.35)" />

              {/* Hyderabad */}
              <circle cx="290" cy="335" r="3" fill="rgba(255,255,255,0.3)" />

              {/* Bangalore */}
              <circle cx="268" cy="390" r="2.5" fill="rgba(255,255,255,0.25)" />
            </g>

            {/* Cluster label annotation */}
            <g className="geo-annotation">
              <line x1="280" y1="295" x2="330" y2="265" stroke="rgba(192,57,43,0.35)" strokeWidth="0.75" />
              <text x="335" y="260" fill="rgba(192,57,43,0.8)" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="500" letterSpacing="0.08em">PUNE EAST</text>
              <text x="335" y="272" fill="rgba(192,57,43,0.6)" fontSize="7" fontFamily="Inter, sans-serif" letterSpacing="0.06em">HIGH COMPLAINT DENSITY</text>
            </g>
          </svg>
        </div>

        {/* Red Zone definition */}
        <div className="geo-redzone reveal animate-reveal-delay-2">
          <div className="geo-redzone-header">
            <span className="tag tag-red">RED ZONE</span>
          </div>
          <p className="geo-redzone-def body-md">
            A geographic area where citizen complaints are unusually concentrated
            and indicate a potential infrastructure or service gap.
          </p>
          <div className="geo-redzone-data">
            {[
              ["LOCATION", "Pune East"],
              ["DOMAIN", "Water"],
              ["SIGNALS", "2,431"],
              ["DEMAND", "High"],
              ["RESPONSE", "Low"],
            ].map(([k, v]) => (
              <div key={k} className="geo-data-row">
                <span className="label-eyebrow">{k}</span>
                <span className="geo-data-value">{v}</span>
              </div>
            ))}
          </div>
          <div className="geo-recommendation">
            <p className="label-eyebrow" style={{ marginBottom: "var(--sp-xs)" }}>Recommended action</p>
            <p className="geo-rec-text">
              → Prioritize water network inspection and service restoration.<br />
              Increase allocation by <span className="num-orange">₹12 Cr</span>
              <span className="disclaimer" style={{ display: "inline-block", marginLeft: "var(--sp-sm)", verticalAlign: "middle" }}>AI RECOMMENDATION — PENDING APPROVAL</span>
            </p>
          </div>
        </div>
      </div>
    </SectionBase>
  );
}
