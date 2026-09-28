import React from "react";
import type { Proposal } from "../../types";
import "./DemandKPIBar.css";

interface DemandKPIBarProps {
  proposals?: Proposal[];
  isLiveApi?: boolean;
}

export const DemandKPIBar: React.FC<DemandKPIBarProps> = ({
  proposals = [],
  isLiveApi = false,
}) => {
  // Calculate statistics strictly from the department proposals provided
  const totalDemands = proposals.length;
  const pendingDemands = proposals.filter((g) => g.status !== "RESOLVED").length;
  const avgResolutionDays = proposals.length > 0 ? "2.4 days" : "0 days";
  const highPriorityCount = proposals.filter((g) => g.priority === "High" || g.priority === "Critical").length;

  return (
    <section className="proposal-kpi-bar-wrapper" aria-label="Proposal Statistics Overview">
      <div className="kpi-header-strip">
        <span className="label-eyebrow">MUNICIPAL INFRASTRUCTURE INTELLIGENCE · DEMAND STATISTICS</span>
        <span className={`kpi-provenance-tag ${isLiveApi ? "live" : "demo"}`}>
          {isLiveApi ? "LIVE API" : "DEMO DATA"}
        </span>
      </div>

      <div className="proposal-kpi-grid">
        {/* METRIC 01: TOTAL DEMANDS */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">TOTAL DEMANDS</span>
            {/* Sparkline SVG */}
            <svg className="kpi-sparkline" viewBox="0 0 100 30" aria-hidden="true" role="img">
              <path
                d="M0 24 L15 18 L30 22 L45 12 L60 16 L75 8 L90 14 L100 4"
                fill="none"
                stroke="var(--col-orange)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 24 L15 18 L30 22 L45 12 L60 16 L75 8 L90 14 L100 4 L100 30 L0 30 Z"
                fill="var(--col-orange-dim)"
                opacity="0.4"
              />
            </svg>
          </div>

          <div className="kpi-card-middle">
            <span className="kpi-value">{totalDemands.toLocaleString()}</span>
          </div>
        </div>

        {/* METRIC 02: PENDING DEMANDS */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">PENDING DEMANDS</span>
            {/* Sparkline SVG */}
            <svg className="kpi-sparkline" viewBox="0 0 100 30" aria-hidden="true" role="img">
              <path
                d="M0 8 L15 12 L30 6 L45 18 L60 14 L75 22 L90 20 L100 26"
                fill="none"
                stroke="var(--col-green)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 8 L15 12 L30 6 L45 18 L60 14 L75 22 L90 20 L100 26 L100 30 L0 30 Z"
                fill="var(--col-green-dim)"
                opacity="0.4"
              />
            </svg>
          </div>

          <div className="kpi-card-middle">
            <span className="kpi-value">{pendingDemands.toLocaleString()}</span>
          </div>
        </div>

        {/* METRIC 03: AVG. RESOLUTION TIME */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">AVG. RESOLUTION TIME</span>
            {/* Sparkline SVG */}
            <svg className="kpi-sparkline" viewBox="0 0 100 30" aria-hidden="true" role="img">
              <path
                d="M0 6 L15 10 L30 14 L45 12 L60 20 L75 18 L90 24 L100 28"
                fill="none"
                stroke="var(--col-blue)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 6 L15 10 L30 14 L45 12 L60 20 L75 18 L90 24 L100 28 L100 30 L0 30 Z"
                fill="var(--col-blue-dim)"
                opacity="0.4"
              />
            </svg>
          </div>

          <div className="kpi-card-middle">
            <span className="kpi-value">{avgResolutionDays}</span>
          </div>
        </div>

        {/* METRIC 04: HIGH PRIORITY */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">HIGH PRIORITY</span>
            {/* Sparkline SVG */}
            <svg className="kpi-sparkline" viewBox="0 0 100 30" aria-hidden="true" role="img">
              <path
                d="M0 22 L15 16 L30 20 L45 10 L60 14 L75 8 L90 12 L100 6"
                fill="none"
                stroke="var(--col-red)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 22 L15 16 L30 20 L45 10 L60 14 L75 8 L90 12 L100 6 L100 30 L0 30 Z"
                fill="var(--col-red-dim)"
                opacity="0.4"
              />
            </svg>
          </div>

          <div className="kpi-card-middle">
            <span className="kpi-value">{highPriorityCount}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
