import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary, RedZone, PolicyActionRequest } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const MOCK_SUMMARY: DashboardSummary = {
  executive_summary:
    "4,200 verified complaints in Pune over the last 7 days. Water infrastructure dominates grievance volume. 14 Red Zone clusters require immediate policy action.",
  weekly_stats: {
    district: "Pune",
    total_complaints: 4200,
    top_domain: "Water",
    avg_severity: 7.2,
    red_zone_count: 14,
    period: "last_7_days",
  },
};

const MOCK_RED_ZONES: RedZone[] = [
  { lat: 18.5204, lng: 73.8567, density: 420, domain: "Water", district: "Pune" },
  { lat: 19.0760, lng: 72.8777, density: 380, domain: "Road", district: "Mumbai" },
  { lat: 28.6139, lng: 77.2090, density: 510, domain: "Power", district: "Delhi" },
];

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
      console.warn("Backend fetch failed, falling back to mock data:", err);
      setSummary({
        ...MOCK_SUMMARY,
        executive_summary: district
          ? `4,200 verified complaints in ${district} over the last 7 days. Water infrastructure dominates grievance volume. 14 Red Zone clusters require immediate policy action.`
          : MOCK_SUMMARY.executive_summary,
        weekly_stats: {
          ...MOCK_SUMMARY.weekly_stats,
          district: district || "Pune",
        },
      });
      setRedZones(MOCK_RED_ZONES);
      setError("Backend server offline — showing demo fallback data. Run backend: uvicorn spin_agents.api:app --port 8080");
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
