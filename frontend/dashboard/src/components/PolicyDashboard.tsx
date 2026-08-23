import { useMemo, useState } from "react";
import { HeatMap } from "./HeatMap";
import { ExecutiveSummaryPanel } from "./ExecutiveSummaryPanel";
import { BudgetReallocationPanel } from "./BudgetReallocationPanel";
import { usePolicyData } from "../hooks/usePolicyData";
import { getDistrictsByState, getAllStateNames } from "../data/indiaGeoData";
import type { BudgetAllocation } from "../types";

export function PolicyDashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const { summary, redZones, loading, error, refresh, approvePolicyAction } = usePolicyData();

  const [stateFilter, setStateFilter] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [stateSearch, setStateSearch] = useState<string>("");
  const [districtSearch, setDistrictSearch] = useState<string>("");

  const allStateNames = useMemo(() => getAllStateNames(), []);

  const filteredStates = useMemo(() =>
    stateSearch
      ? allStateNames.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))
      : allStateNames,
    [allStateNames, stateSearch]
  );

  const districtsForState = useMemo(() =>
    stateFilter ? getDistrictsByState(stateFilter) : [],
    [stateFilter]
  );

  const filteredDistricts = useMemo(() =>
    districtSearch
      ? districtsForState.filter((d) => d.toLowerCase().includes(districtSearch.toLowerCase()))
      : districtsForState,
    [districtsForState, districtSearch]
  );

  const topRedZoneDomain = redZones[0]?.domain;

  const handleSearch = () => {
    refresh(districtFilter || undefined, stateFilter || undefined);
  };

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
      message_en: `Budget reallocation approved for ${topAllocation.domain} infrastructure.`,
    });
    await refresh(districtFilter || undefined, stateFilter || undefined);
  };

  return (
    <div className="dashboard">
      {/* Header with Back to Home on the Left */}
      <header className="dashboard-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {onNavigate && (
            <button
              onClick={() => onNavigate("landing")}
              className="btn-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--col-navy)",
                background: "var(--col-surface)",
                borderColor: "var(--col-border)",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              ← Back to Home
            </button>
          )}

          <div className="dashboard-title-group">
            <h1>POLICYMAKER / LIVE INTELLIGENCE</h1>
            <span className="dashboard-subtitle">Public Infrastructure Intelligence Command Center</span>
          </div>
        </div>

        <div className="dashboard-status">
          <span className="status-dot" />
          SYSTEM OPERATIONAL
        </div>

        {/* State + District Selector Controls */}
        <div className="header-controls" style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "380px" }}>
          {/* State Row */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Search state..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                style={{
                  width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid var(--col-border)",
                  borderRadius: "4px", background: "var(--col-surface)", boxSizing: "border-box"
                }}
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setDistrictFilter(""); // reset district on state change
                setDistrictSearch("");
              }}
              className="district-select"
              aria-label="Filter by state"
              style={{ flex: 2 }}
            >
              <option value="">All States / UTs</option>
              {filteredStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Row — only shown when a state is selected */}
          {stateFilter && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search district..."
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  style={{
                    width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid var(--col-border)",
                    borderRadius: "4px", background: "var(--col-surface)", boxSizing: "border-box"
                  }}
                />
              </div>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="district-select"
                aria-label="Filter by district"
                style={{ flex: 2 }}
              >
                <option value="">All Districts in {stateFilter}</option>
                {filteredDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search & Refresh buttons */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className="refresh-btn"
              onClick={handleSearch}
              disabled={loading}
              style={{ flex: 1, background: "var(--col-orange)", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
            >
              {loading ? "Loading..." : "🔍 Search"}
            </button>
            <button
              className="refresh-btn"
              onClick={() => {
                setStateFilter("");
                setDistrictFilter("");
                setStateSearch("");
                setDistrictSearch("");
                refresh(undefined, undefined);
              }}
              disabled={loading}
            >
              Reset
            </button>
            {onNavigate && (
              <button
                className="refresh-btn"
                onClick={() => onNavigate("approval-portal")}
                style={{ whiteSpace: "nowrap", fontSize: "11px" }}
              >
                📋 Approval Portal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <div className="error-banner-content">
            <strong>LIVE INTELLIGENCE UNAVAILABLE</strong>
            <span> — Could not retrieve the latest intelligence feed.</span>
          </div>
          <button className="error-retry-btn" onClick={() => refresh(districtFilter || undefined, stateFilter || undefined)}>
            Retry
          </button>
        </div>
      )}

      {/* Main Grid */}
      <main className="dashboard-main">
        <section className="map-section">
          <div className="map-label">
            <div className="map-label-left">
              <span className="red-dot" />
              <span>LIVE CIVIC SIGNALS</span>
              <span className="map-sub-tag">SPATIAL FEED</span>
            </div>
            <div className="map-label-right">
              {districtFilter ? (
                <span className="district-tag">District: {districtFilter}, {stateFilter}</span>
              ) : stateFilter ? (
                <span className="district-tag">State: {stateFilter}</span>
              ) : (
                <span className="district-tag">All India Coverage</span>
              )}
            </div>
          </div>

          <div className="map-wrapper" style={{ position: "relative", flex: 1, minHeight: "520px" }}>
            <HeatMap
              redZones={redZones}
              selectedDistrict={districtFilter || undefined}
              selectedState={stateFilter || undefined}
            />
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
            selectedState={stateFilter || undefined}
            selectedDistrict={districtFilter || undefined}
          />
        </section>
      </main>
    </div>
  );
}

// Keep named export + default for backward compat
export default PolicyDashboard;
