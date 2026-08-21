export interface RedZone {
  lat: number;
  lng: number;
  density: number;
  domain: InfrastructureDomain;
  district: string;
}

export type InfrastructureDomain = "Water" | "Road" | "Power" | "Rail" | "Telecom";

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
  domain: InfrastructureDomain;
  current_cr: number;
  proposed_cr: number;
}

export interface PolicyActionRequest {
  grievance_id: string;
  user_id: string;
  target_language: string;
  action: "approved" | "rejected" | "reallocated";
  budget_cr?: number;
  message_en?: string;
}
