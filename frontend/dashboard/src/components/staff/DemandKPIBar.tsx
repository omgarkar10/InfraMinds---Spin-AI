import React from "react";
import "./DemandKPIBar.css";

interface DemandKPIBarProps {
  metrics?: {
    total_demands: number;
    pending_demands: number;
    avg_resolution_days: string | number;
    high_priority: number;
  } | null;
  isLiveApi?: boolean;
}

export const DemandKPIBar: React.FC<DemandKPIBarProps> = ({
  metrics,
  isLiveApi = false,
}) => {
  const m = metrics || { total_demands: 0, pending_demands: 0, avg_resolution_days: 0, high_priority: 0 };
  
  return (
    <section className="proposal-kpi-bar-wrapper" aria-label="Proposal Statistics Overview">
      <div className="kpi-header-strip">
        <span className="label-eyebrow">MUNICIPAL INFRASTRUCTURE INTELLIGENCE · DEMAND STATISTICS</span>
        <span className={`kpi-provenance-tag ${isLiveApi ? "live" : "demo"}`}>
          {isLiveApi ? "LIVE API" : "DEMO DATA"}
        </span>
      </div>

      <div className="kpi-grid">
        <div className="kpi-metric-card">
          <div className="kpi-content-left">
            <span className="kpi-label">TOTAL DEMANDS</span>
            <span className="kpi-value">{m.total_demands.toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-content-left">
            <span className="kpi-label">PENDING DEMANDS</span>
            <span className="kpi-value">{m.pending_demands.toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-content-left">
            <span className="kpi-label">AVG. RESOLUTION</span>
            <span className="kpi-value">{m.avg_resolution_days}</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-content-left">
            <span className="kpi-label">HIGH PRIORITY</span>
            <span className="kpi-value">{m.high_priority.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
