import type { InfrastructureDomain } from "../domain";

export type BudgetCategory =
  | "Water Supply"
  | "Roads & Potholes"
  | "Drainage / Flooding"
  | "Electricity"
  | "Waste Management"
  | "Street Lighting"
  | "Public Transport"
  | "Sanitation"
  | "Public Infrastructure"
  | "Other";

export interface WeeklyStats {
  district: string;
  total_complaints: number;
  top_domain: InfrastructureDomain;
  avg_severity: number;
  red_zone_count: number;
  period: string;
}

export interface DashboardSummary {
  executive_summary: string;
  weekly_stats: WeeklyStats;
}

export interface BudgetAllocation {
  domain: string;
  current_cr: number;
  proposed_cr: number;
  recommended_cr: number;
}
