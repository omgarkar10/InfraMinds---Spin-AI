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
      message_en: `Budget reallocation approved for ${topAllocation.domain} infrastructure. Your proposal is being addressed.`,
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
            className="btn-outline"
            onClick={() => alert("Downloading PDF Impact Report...")}
            style={{ borderColor: "var(--col-navy)", color: "var(--col-navy)", background: "#fff", padding: "6px 12px", fontSize: "12px", fontWeight: "bold" }}
          >
            📥 Export Impact Summary
          </button>
          <button
            className="refresh-btn"
            onClick={() => refresh(districtFilter || undefined)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Map"}
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
                <span>Red Zone Cluster — High Priority</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot blue" />
                <span>Verified Civic Proposal Location</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel Stack */}
        <section className="side-panels" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <ExecutiveSummaryPanel summary={summary} loading={loading} />
          
          <div className="panel" style={{ padding: "20px" }}>
            <div className="panel-header" style={{ marginBottom: "16px" }}>
              <h2 className="panel-title">Vote Velocity & Trend Panel</h2>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--col-text-muted)" }}>Current Support Velocity</span>
                <span style={{ fontSize: "12px", color: "var(--col-green)", fontWeight: "bold" }}>↑ +420 votes/hr</span>
              </div>
              <svg viewBox="0 0 100 30" style={{ width: "100%", height: "40px" }} aria-hidden="true" role="img">
                <path d="M0 24 L15 22 L30 18 L45 20 L60 12 L75 14 L90 6 L100 2" fill="none" stroke="var(--col-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0 24 L15 22 L30 18 L45 20 L60 12 L75 14 L90 6 L100 2 L100 30 L0 30 Z" fill="var(--col-orange-dim)" opacity="0.4" />
              </svg>
            </div>
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #eee" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "10px", color: "var(--col-navy)" }}>Category Allocation Breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Public Transit</span> <span>45%</span></div>
                <div style={{ width: "100%", background: "#eee", height: "6px", borderRadius: "3px" }}><div style={{ width: "45%", background: "var(--col-blue)", height: "100%", borderRadius: "3px" }}/></div>
                
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Sanitation</span> <span>30%</span></div>
                <div style={{ width: "100%", background: "#eee", height: "6px", borderRadius: "3px" }}><div style={{ width: "30%", background: "var(--col-orange)", height: "100%", borderRadius: "3px" }}/></div>
                
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Public Parks</span> <span>25%</span></div>
                <div style={{ width: "100%", background: "#eee", height: "6px", borderRadius: "3px" }}><div style={{ width: "25%", background: "var(--col-green)", height: "100%", borderRadius: "3px" }}/></div>
              </div>
            </div>
          </div>

          <BudgetReallocationPanel
            onApprove={handleApprove}
            redZoneDomain={topRedZoneDomain}
          />
        </section>
      </main>
    </div>
  );
}

