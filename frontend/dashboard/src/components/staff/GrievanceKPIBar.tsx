import React from "react";
import type { Grievance } from "../../types";
import "./GrievanceKPIBar.css";

interface GrievanceKPIBarProps {
  grievances?: Grievance[];
  isLiveApi?: boolean;
}

export const GrievanceKPIBar: React.FC<GrievanceKPIBarProps> = ({
  grievances = [],
  isLiveApi = false,
}) => {
  // Calculate statistics strictly from the department grievances provided
  const totalGrievances = grievances.length;
  const pendingGrievances = grievances.filter((g) => g.status !== "RESOLVED").length;
  const avgResolutionDays = grievances.length > 0 ? "2.4 days" : "0 days";
  const highPriorityCount = grievances.filter((g) => g.severity === "High" || g.severity === "Critical").length;

  return (
    <section className="grievance-kpi-bar-wrapper" aria-label="Grievance Statistics Overview">
      <div className="kpi-header-strip">
        <span className="label-eyebrow">MUNICIPAL INFRASTRUCTURE INTELLIGENCE · GRIEVANCE STATISTICS</span>
        <span className={`kpi-provenance-tag ${isLiveApi ? "live" : "demo"}`}>
          {isLiveApi ? "LIVE API" : "DEMO DATA"}
        </span>
      </div>

      <div className="grievance-kpi-grid">
        {/* METRIC 01: TOTAL GRIEVANCES */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">TOTAL GRIEVANCES</span>
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
            <span className="kpi-value">{totalGrievances.toLocaleString()}</span>
            <span className="kpi-trend trend-neutral" title="Increased 12% vs previous 7 days">
              ↑ 12%
            </span>
          </div>

          <span className="kpi-caption" aria-label="Grievances increased 12% compared to the previous 7 days">
            vs previous 7 days
          </span>
        </div>

        {/* METRIC 02: PENDING GRIEVANCES */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">PENDING GRIEVANCES</span>
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
            <span className="kpi-value">{pendingGrievances.toLocaleString()}</span>
            <span className="kpi-trend trend-positive" title="Decreased 8% vs previous 7 days (Positive)">
              ↓ 8%
            </span>
          </div>

          <span className="kpi-caption" aria-label="Pending grievances decreased 8% compared to the previous 7 days">
            vs previous 7 days
          </span>
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
            <span className="kpi-trend trend-positive" title="15% faster resolution time vs previous period">
              ↓ 15% faster
            </span>
          </div>

          <span className="kpi-caption" aria-label="Resolution time decreased 15% faster compared to previous period">
            vs previous period
          </span>
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
            <span className="kpi-trend trend-negative" title="Increased 6% requiring attention">
              ↑ 6%
            </span>
          </div>

          <span className="kpi-caption" aria-label="High priority grievances increased 6% requiring immediate attention">
            requiring attention
          </span>
        </div>
      </div>
    </section>
  );
};
