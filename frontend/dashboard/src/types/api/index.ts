export interface PolicyActionRequest {
  grievance_id: string;
  user_id: string;
  target_language: string;
  action: "approved" | "rejected" | "reallocated";
  budget_cr?: number;
  message_en?: string;
}
