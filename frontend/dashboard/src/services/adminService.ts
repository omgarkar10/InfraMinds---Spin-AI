import { auth } from "../config/firebase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const getHeaders = async () => {
  const token = (auth.currentUser ? await auth.currentUser.getIdToken() : null) || localStorage.getItem("staff_token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

export const fetchDistrictStaff = async () => {
  const res = await fetch(`${API_BASE}/admin/staff`, { headers: await getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch staff");
  return res.json();
};

export const fetchDistrictMetrics = async () => {
  const res = await fetch(`${API_BASE}/admin/metrics`, { headers: await getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
};

export const inviteStaff = async (payload: { email: string, role: string, department_id?: string, district_id?: string }) => {
  const res = await fetch(`${API_BASE}/admin/staff/invite`, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to invite staff");
  return res.json();
};

export const updateStaff = async (uid: string, payload: any) => {
  const res = await fetch(`${API_BASE}/admin/staff/${uid}`, {
    method: "PATCH",
    headers: await getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update staff");
  return res.json();
};

export const deactivateStaff = async (uid: string) => {
  const res = await fetch(`${API_BASE}/admin/staff/${uid}`, {
    method: "DELETE",
    headers: await getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to deactivate staff");
  return res.json();
};
