import React from "react";
import type { Grievance } from "../../types";
import "./GrievanceKPIBar.css";

interface GrievanceKPIBarProps {
  grievances?: Grievance[];
}

export const GrievanceKPIBar: React.FC<GrievanceKPIBarProps> = ({
  grievances = [],
}) => {
  // All values computed purely from actual submitted grievances — no hardcoded data
  const totalGrievances = grievances.length;
  const pending = grievances.filter(
    (g) => g.status !== "RESOLVED" && g.status !== "ACTION_TAKEN"
  ).length;
  const resolved = grievances.filter((g) => g.status === "RESOLVED").length;
  const highPriorityCount = grievances.filter(
    (g) => g.severity === "High" || g.severity === "Critical"
  ).length;

  // Avg resolution: count resolved vs total as a rough ratio
  const resolutionRate =
    totalGrievances > 0
      ? `${Math.round((resolved / totalGrievances) * 100)}%`
      : "—";

  return (
    <section className="grievance-kpi-bar-wrapper" aria-label="Grievance Statistics Overview">
      <div className="kpi-header-strip">
        <span className="label-eyebrow">MUNICIPAL INFRASTRUCTURE INTELLIGENCE · GRIEVANCE STATISTICS</span>
        <span className="kpi-provenance-tag live">LIVE DATA</span>
      </div>

      <div className="grievance-kpi-grid">
        {/* METRIC 01: TOTAL GRIEVANCES */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">TOTAL GRIEVANCES</span>
            <svg className="kpi-sparkline" viewBox="0 0 100 30" aria-hidden="true" role="img">
              <path d="M0 24 L15 18 L30 22 L45 12 L60 16 L75 8 L90 14 L100 4" fill="none" stroke="var(--col-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M0 24 L15 18 L30 22 L45 12 L60 16 L75 8 L90 14 L100 4 L100 30 L0 30 Z" fill="var(--col-orange-dim)" opacity="0.4" />
            </svg>
          </div>
          <div className="kpi-card-middle">
            <span className="kpi-value">{totalGrievances.toLocaleString()}</span>
          </div>
          <span className="kpi-caption">submitted grievances</span>
        </div>

        {/* METRIC 02: PENDING */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">PENDING GRIEVANCES</span>
            <svg className="kpi-sparkline" viewBox="0 0 100 30" aria-hidden="true" role="img">
              <path d="M0 8 L15 12 L30 6 L45 18 L60 14 L75 22 L90 20 L100 26" fill="none" stroke="var(--col-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M0 8 L15 12 L30 6 L45 18 L60 14 L75 22 L90 20 L100 26 L100 30 L0 30 Z" fill="var(--col-green-dim)" opacity="0.4" />
            </svg>
          </div>
          <div className="kpi-card-middle">
            <span className="kpi-value">{pending.toLocaleString()}</span>
          </div>
          <span className="kpi-caption">awaiting resolution</span>
        </div>

        {/* METRIC 03: RESOLUTION RATE */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">RESOLUTION RATE</span>
            <svg className="kpi-sparkline" viewBox="0 0 100 30" aria-hidden="true" role="img">
              <path d="M0 6 L15 10 L30 14 L45 12 L60 20 L75 18 L90 24 L100 28" fill="none" stroke="var(--col-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M0 6 L15 10 L30 14 L45 12 L60 20 L75 18 L90 24 L100 28 L100 30 L0 30 Z" fill="var(--col-blue-dim)" opacity="0.4" />
            </svg>
          </div>
          <div className="kpi-card-middle">
            <span className="kpi-value">{resolutionRate}</span>
          </div>
          <span className="kpi-caption">of total resolved</span>
        </div>

        {/* METRIC 04: HIGH PRIORITY */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-label">HIGH PRIORITY</span>
            <svg className="kpi-sparkline" viewBox="0 0 100 30" aria-hidden="true" role="img">
              <path d="M0 22 L15 16 L30 20 L45 10 L60 14 L75 8 L90 12 L100 6" fill="none" stroke="var(--col-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M0 22 L15 16 L30 20 L45 10 L60 14 L75 8 L90 12 L100 6 L100 30 L0 30 Z" fill="var(--col-red-dim)" opacity="0.4" />
            </svg>
          </div>
          <div className="kpi-card-middle">
            <span className="kpi-value">{highPriorityCount}</span>
          </div>
          <span className="kpi-caption">requiring attention</span>
        </div>
      </div>
    </section>
  );
};
