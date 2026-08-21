import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary, RedZone, PolicyActionRequest } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

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
      if (!summaryRes.ok || !zonesRes.ok) throw new Error("Failed to fetch dashboard data");
      const summaryData: DashboardSummary = await summaryRes.json();
      const zonesData = await zonesRes.json();
      setSummary(summaryData);
      setRedZones(zonesData.red_zones ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePolicyAction = useCallback(async (action: PolicyActionRequest) => {
    const res = await fetch(`${API_BASE}/api/dashboard/policy-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    if (!res.ok) throw new Error("Policy action failed");
    return res.json();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, redZones, loading, error, refresh, approvePolicyAction };
}
