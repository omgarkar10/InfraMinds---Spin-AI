import { useMemo, useState } from "react";
import { HeatMap } from "./HeatMap";
import { ExecutiveSummaryPanel } from "./ExecutiveSummaryPanel";
import { BudgetReallocationPanel } from "./BudgetReallocationPanel";
import { usePolicyData } from "../hooks/usePolicyData";
import type { BudgetAllocation } from "../types";

export function PolicyDashboard() {
  const { summary, redZones, loading, error, refresh, approvePolicyAction } = usePolicyData();
  const [districtFilter, setDistrictFilter] = useState<string>("");

  const districts = useMemo(
    () => [...new Set(redZones.map((z) => z.district))].sort(),
    [redZones]
  );

  const topRedZoneDomain = redZones[0]?.domain;

  const handleApprove = async (allocations: BudgetAllocation[]) => {
    const topAllocation = allocations.reduce((max, a) =>
      a.proposed_cr - a.current_cr > max.proposed_cr - max.current_cr ? a : max
    );
    await approvePolicyAction({
      grievance_id: "batch-reallocation",
      user_id: "policy-dashboard",
      target_language: "hi",
      action: "reallocated",
      budget_cr: topAllocation.proposed_cr,
      message_en: `Budget reallocation approved for ${topAllocation.domain} infrastructure. Your grievance is being addressed.`,
    });
    await refresh(districtFilter || undefined);
  };

  return (
    <div className="dashboard">
      {/* Policymaker Operational Header */}
      <header className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>POLICYMAKER / LIVE INTELLIGENCE</h1>
          <span className="dashboard-subtitle">
            Public Infrastructure Intelligence Command Center
          </span>
        </div>

        <div className="dashboard-status">
          <span className="status-dot" />
          SYSTEM OPERATIONAL
        </div>

        <div className="header-controls">
          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              refresh(e.target.value || undefined);
            }}
            className="district-select"
            aria-label="Filter by district"
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            className="refresh-btn"
            onClick={() => refresh(districtFilter || undefined)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Error Recovery Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <div className="error-banner-content">
            <strong>LIVE INTELLIGENCE UNAVAILABLE</strong>
            <span> — The dashboard could not retrieve the latest intelligence feed.</span>
          </div>
          <button className="error-retry-btn" onClick={() => refresh(districtFilter || undefined)}>
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: GIS Map Container + Right Intelligence Panels */}
      <main className="dashboard-main">
        <section className="map-section">
          {/* Top Surrounding Overlay */}
          <div className="map-label">
            <div className="map-label-left">
              <span className="red-dot" />
              <span>LIVE CIVIC SIGNALS</span>
              <span className="map-sub-tag">SPATIAL FEED</span>
            </div>
            <div className="map-label-right">
              {districtFilter ? (
                <span className="district-tag">District: {districtFilter}</span>
              ) : (
                <span className="district-tag">All Districts Coverage</span>
              )}
            </div>
          </div>

          {/* Locked Map Component Area */}
          <div className="map-wrapper" style={{ position: "relative", flex: 1, minHeight: "520px" }}>
            <HeatMap
              redZones={redZones}
              selectedDistrict={districtFilter || undefined}
            />

            {/* Bottom-Left Map Legend Overlay (Surrounding UI only) */}
            <div className="map-legend-overlay">
              <div className="legend-title">GIS LAYER LEGEND</div>
              <div className="legend-item">
                <span className="legend-dot red" />
                <span>Red Zone Cluster — High Severity</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot blue" />
                <span>Verified Civic Grievance Location</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel Stack */}
        <section className="side-panels">
          <ExecutiveSummaryPanel summary={summary} loading={loading} />
          <BudgetReallocationPanel
            onApprove={handleApprove}
            redZoneDomain={topRedZoneDomain}
          />
        </section>
      </main>
    </div>
  );
}

