import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary, RedZone, PolicyActionRequest, InfrastructureDomain } from "../types";
import { getStoredGrievances } from "../services/grievanceService";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function mapCategoryToDomain(cat: string): InfrastructureDomain {
  const lower = (cat || "").toLowerCase();
  if (lower.includes("water") || lower.includes("drain")) return "Water";
  if (lower.includes("road") || lower.includes("pothole") || lower.includes("transport")) return "Road";
  if (lower.includes("electric") || lower.includes("light") || lower.includes("power")) return "Power";
  return "Water";
}

function calculateLiveSummary(districtFilter?: string): { summary: DashboardSummary; redZones: RedZone[] } {
  const all = getStoredGrievances();
  const filtered = districtFilter
    ? all.filter((g) => g.location.district.toLowerCase() === districtFilter.toLowerCase())
    : all;

  if (filtered.length === 0) {
    return {
      summary: {
        executive_summary: districtFilter
          ? `No complaints filed for ${districtFilter} yet.`
          : "No citizen grievances recorded yet. Submit a report via the Citizen Portal to view real-time intelligence summaries.",
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

  const domainCounts: Record<string, number> = {};
  filtered.forEach((g) => {
    domainCounts[g.category] = (domainCounts[g.category] || 0) + 1;
  });

  let topCategory = "Water";
  let maxCount = 0;
  Object.entries(domainCounts).forEach(([domain, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topCategory = domain;
    }
  });

  const topDomain = mapCategoryToDomain(topCategory);
  const redZoneCount = filtered.filter(
    (g) => g.aiAnalysis?.redZone || g.severity === "High" || g.severity === "Critical"
  ).length;

  const severityScores: Record<string, number> = {
    Low: 2.5,
    Medium: 5.0,
    High: 8.0,
    Critical: 10.0,
  };
  const totalSeverity = filtered.reduce((acc, g) => acc + (severityScores[g.severity] || 5.0), 0);
  const avgSeverity = filtered.length > 0 ? Number((totalSeverity / filtered.length).toFixed(1)) : 0;

  const redZones: RedZone[] = filtered.map((g) => ({
    lat: g.location.lat || 18.5204,
    lng: g.location.lng || 73.8567,
    density: 100,
    domain: mapCategoryToDomain(g.category),
    district: g.location.district || "Default",
  }));

  return {
    summary: {
      executive_summary: `${filtered.length} verified complaint(s) recorded in ${districtFilter || "all districts"}. ${topCategory} infrastructure dominates grievance volume. ${redZoneCount} Red Zone cluster(s) logged.`,
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

  const refresh = useCallback(async (district?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = district ? `?district=${encodeURIComponent(district)}` : "";
      const [summaryRes, zonesRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/summary${params}`),
        fetch(`${API_BASE}/api/dashboard/red-zones`),
      ]);
      if (!summaryRes.ok || !zonesRes.ok) throw new Error("Backend server unreachable");
      const summaryData: DashboardSummary = await summaryRes.json();
      const zonesData = await zonesRes.json();
      setSummary(summaryData);
      setRedZones(zonesData.red_zones ?? []);
    } catch (err) {
      console.warn("Backend fetch failed, calculating live data from storage:", err);
      const live = calculateLiveSummary(district);
      setSummary(live.summary);
      setRedZones(live.redZones);
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePolicyAction = useCallback(async (action: PolicyActionRequest) => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/policy-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      if (!res.ok) throw new Error("Policy action failed");
      return await res.json();
    } catch (err) {
      console.warn("Policy action endpoint offline, mock response returned:", err);
      return {
        status: action.action,
        notification: { status: "mock_sent", to: action.user_id },
        budget_reallocated_cr: action.budget_cr,
      };
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, redZones, loading, error, refresh, approvePolicyAction };
}
