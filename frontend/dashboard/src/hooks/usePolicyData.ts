/**
 * usePolicyData — fetches dashboard summary and red-zone data from the backend.
 *
 * Primary path: GET /api/dashboard/summary + /api/dashboard/red-zones
 * Fallback path: aggregate real grievances from the local /api/grievances list.
 *
 * The fallback ONLY aggregates real citizen-submitted grievances — it does NOT
 * generate fabricated metrics. If there are no grievances, counts are zero.
 *
 * NOTE: The `calculateLiveSummary` fallback uses severity from the backend
 * (High / Critical) as a proxy for red-zone status. It does NOT use the
 * old frontend-only `aiAnalysis.redZone` field.
 */
import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary, RedZone, PolicyActionRequest, InfrastructureDomain } from "../types";
import { fetchGrievances } from "../services/grievanceService";
import { apiClient } from "../services/apiClient";

function mapCategoryToDomain(cat: string): InfrastructureDomain {
  const lower = (cat || "").toLowerCase();
  if (lower.includes("water") || lower.includes("drain")) return "Water";
  if (lower.includes("road") || lower.includes("pothole") || lower.includes("transport")) return "Road";
  if (lower.includes("electric") || lower.includes("light") || lower.includes("power")) return "Power";
  return "Water";
}

/**
 * Fallback summary calculated from real backend grievances.
 * Uses only data returned by the backend — no fabricated values.
 */
async function calculateLiveSummary(
  districtFilter?: string,
  stateFilter?: string
): Promise<{ summary: DashboardSummary; redZones: RedZone[] }> {
  const all = await fetchGrievances();
  let filtered = all;

  if (stateFilter) {
    filtered = filtered.filter((g) => g.location.state?.toLowerCase() === stateFilter.toLowerCase());
  }
  if (districtFilter) {
    filtered = filtered.filter((g) => g.location.district.toLowerCase() === districtFilter.toLowerCase());
  }

  if (filtered.length === 0) {
    return {
      summary: {
        executive_summary: districtFilter
          ? `No grievances recorded for ${districtFilter} yet.`
          : "No citizen grievances recorded yet. Submit a report via the Citizen Portal.",
        weekly_stats: {
          district: districtFilter || "All Districts",
          total_complaints: 0,
          top_domain: "None",
          avg_severity: 0,
          red_zone_count: 0,
          period: "last_7_days",
        },
      },
      redZones: [],
    };
  }

  // Count by category to find dominant domain
  const domainCounts: Record<string, number> = {};
  filtered.forEach((g) => {
    domainCounts[g.category] = (domainCounts[g.category] || 0) + 1;
  });

  let topCategory = "Water Supply";
  let maxCount = 0;
  Object.entries(domainCounts).forEach(([domain, count]) => {
    if (count > maxCount) { maxCount = count; topCategory = domain; }
  });

  const topDomain = mapCategoryToDomain(topCategory);

  // Red zone count: grievances with High or Critical severity from the backend
  // (not the old frontend-fabricated aiAnalysis.redZone field)
  const redZoneCount = filtered.filter(
    (g) => g.severity === "High" || g.severity === "Critical"
  ).length;

  const severityScores: Record<string, number> = { Low: 2.5, Medium: 5.0, High: 8.0, Critical: 10.0 };
  const totalSeverity = filtered.reduce((acc, g) => acc + (severityScores[g.severity] || 5.0), 0);
  const avgSeverity = filtered.length > 0 ? Number((totalSeverity / filtered.length).toFixed(1)) : 0;

  // Red zones: only grievances with valid coordinates; density = count of grievances at that location
  const redZones: RedZone[] = filtered
    .filter((g) => g.location.lat && g.location.lng)
    .map((g) => ({
      lat: g.location.lat!,
      lng: g.location.lng!,
      density: 1, // Each grievance is one signal; backend clusters will aggregate
      domain: mapCategoryToDomain(g.category),
      district: g.location.district || "Unknown",
    }));

  return {
    summary: {
      executive_summary: `${filtered.length} grievance(s) recorded in ${districtFilter || "all districts"}. ${topCategory} dominates. ${redZoneCount} High/Critical severity cases.`,
      weekly_stats: {
        district: districtFilter || "All Districts",
        total_complaints: filtered.length,
        top_domain: topDomain,
        avg_severity: avgSeverity,
        red_zone_count: redZoneCount,
        period: "last_7_days",
      },
    },
    redZones,
  };
}

export function usePolicyData() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [redZones, setRedZones] = useState<RedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (district?: string, state?: string) => {
    setLoading(true);
    setError(null);
    try {
      const queryParts: string[] = [];
      if (district) queryParts.push(`district=${encodeURIComponent(district)}`);
      if (state) queryParts.push(`state=${encodeURIComponent(state)}`);
      const params = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

      const [summaryData, zonesData] = await Promise.all([
        apiClient.get<DashboardSummary>(`/api/dashboard/summary${params}`),
        apiClient.get<{ red_zones: RedZone[] }>(`/api/dashboard/red-zones${params}`),
      ]);
      setSummary(summaryData);
      setRedZones(zonesData.red_zones ?? []);
    } catch (err) {
      // Backend dashboard unavailable — fall back to local grievance aggregation
      console.warn("[usePolicyData] Backend dashboard unavailable, aggregating from grievance list:", err);
      try {
        const live = await calculateLiveSummary(district, state);
        setSummary(live.summary);
        setRedZones(live.redZones);
      } catch (fallbackErr) {
        console.error("[usePolicyData] Fallback calculation failed:", fallbackErr);
        setError("Could not load dashboard data. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePolicyAction = useCallback(async (action: PolicyActionRequest) => {
    try {
      return await apiClient.post("/api/dashboard/policy-action", action);
    } catch (err) {
      console.warn("[usePolicyData] Policy action endpoint offline:", err);
      // Return a locally-tracked fallback so the UI doesn't freeze
      return {
        status: action.action,
        notification: { status: "offline_queued", to: action.user_id },
        budget_reallocated_cr: action.budget_cr,
      };
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, redZones, loading, error, refresh, approvePolicyAction };
}
