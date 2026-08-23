// Approval Service — localStorage-based approval tracking
// Stores budget recommendation submissions and ministry review decisions

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRecord {
  id: string;
  category: string;
  proposed_cr: number;
  current_cr: number;
  recommended_cr: number;
  submittedBy: string;
  submittedAt: string;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  ministryNotes?: string;
  state?: string;
  district?: string;
}

const STORAGE_KEY = "spin_approval_records";

export function getApprovalRecords(): ApprovalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApprovalRecord(record: Omit<ApprovalRecord, "id" | "submittedAt" | "status">): ApprovalRecord {
  const records = getApprovalRecords();
  const newRecord: ApprovalRecord = {
    ...record,
    id: `APR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
    status: "pending",
  };
  records.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
}

export function updateApprovalStatus(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string,
  ministryNotes?: string
): boolean {
  const records = getApprovalRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  records[idx] = {
    ...records[idx],
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    ministryNotes: ministryNotes || "",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return true;
}

export function clearApprovalRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}
