import { SectionBase } from "./SectionBase";
import "./GeospatialSection.css";

export function GeospatialSection() {
  return (
    <SectionBase id="spatial" number="06" label="FROM COMPLAINTS TO RED ZONES">
      <div className="geo-layout">
        {/* Title */}
        <div className="geo-heading">
          <h2 className="editorial-h2">
            From individual complaints<br />
            <span className="problem-h2-highlight">to geographic infrastructure red zones.</span>
          </h2>
          <p className="body-lg geo-subtitle">
            SPIN aggregates scattered citizen signals to calculate cluster density and highlight high-demand Red Zones.
          </p>
        </div>

        <div className="geo-grid">
          {/* Left Column: Red Zone Breakdown Card */}
          <div className="redzone-spec-card">
            <div className="redzone-card-header">
              <span className="tag-red-badge">🔴 RED ZONE ALERT</span>
              <span className="provenance-tag">PUNE EAST / WARD 14</span>
            </div>

            <div className="redzone-stats-grid">
              <div className="stat-box">
                <span className="label-eyebrow">GRIEVANCES</span>
                <span className="num-large num-orange">37</span>
              </div>
              <div className="stat-box">
                <span className="label-eyebrow">CLUSTER AREA</span>
                <span className="num-large">12 km²</span>
              </div>
              <div className="stat-box">
                <span className="label-eyebrow">DOMAIN</span>
                <span className="stat-text bold">Water</span>
              </div>
              <div className="stat-box">
                <span className="label-eyebrow">SEVERITY</span>
                <span className="stat-text red-text">HIGH (8.5/10)</span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="ai-rec-box">
              <span className="label-eyebrow tag-orange">AI POLICY RECOMMENDATION</span>
              <h4 className="rec-heading">"Prioritize water network assessment & main pipeline replacement on Segment W-402."</h4>
              <span className="rec-amount">Budget Allocation: ₹12 Cr</span>
              <span className="status-pending">● Awaiting Human Approval</span>
            </div>

            {/* WHY THIS ZONE? Evidence Points */}
            <div className="why-zone-evidence">
              <span className="label-eyebrow">WHY THIS ZONE? (EMPIRICAL EVIDENCE BACKBONE)</span>
              <ul className="evidence-list">
                <li><strong>Density Threshold:</strong> Grievance density reached 3.1 complaints/km² (Baseline: 0.8/km²).</li>
                <li><strong>Infrastructure Asset Correlation:</strong> 84% of complaints pinpoint main line W-402 rupture.</li>
                <li><strong>Service Gap Duration:</strong> Unresolved duration average spans 21 consecutive days.</li>
                <li><strong>Demographic Impact:</strong> Affects over 14,000 residents including 2 primary public schools.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Visual Map Context Representation */}
          <div className="geo-map-visual">
            <div className="visual-header">
              <span className="label-eyebrow">SPATIAL CLUSTERING OVERLAY</span>
              <span className="provenance-tag">PM GATI SHAKTI GIS</span>
            </div>
            <div className="map-placeholder-graphic">
              <div className="graphic-grid">
                <div className="redzone-cluster-circle">
                  <span className="cluster-ping" />
                  <span className="cluster-label">RED ZONE #402</span>
                  <span className="cluster-count">37 Signals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionBase>
  );
}

