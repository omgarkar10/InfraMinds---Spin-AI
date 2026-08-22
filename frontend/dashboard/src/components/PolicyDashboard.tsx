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
      <header className="dashboard-header">
        <div>
          <h1>POLICYMAKER / LIVE INTELLIGENCE</h1>
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
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button className="refresh-btn" onClick={() => refresh(districtFilter || undefined)}>
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <main className="dashboard-main">
        <section className="map-section">
          <div className="map-label">
            <span className="red-dot" />
            Red Zones — High Complaint Density
          </div>
          <HeatMap
            redZones={redZones}
            selectedDistrict={districtFilter || undefined}
          />
        </section>

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
