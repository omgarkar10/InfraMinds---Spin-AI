import { API_BASE } from "../config";

export class ApiError extends Error {
  constructor(public status: number, public message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  requireAuth?: boolean; // Set true when auth tokens are implemented
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP Error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.error || errorMessage;
    } catch {
      // Ignore JSON parse errors for non-JSON responses
    }
    throw new ApiError(response.status, errorMessage);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Failed to parse API response as JSON");
  }
}

export const apiClient = {
  async get<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    // if (options.requireAuth) add auth token here

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      method: "GET",
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body: any, options: FetchOptions = {}): Promise<T> {
    const headers = new Headers({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    });
    // if (options.requireAuth) add auth token here

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      method: "POST",
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body: any, options: FetchOptions = {}): Promise<T> {
    const headers = new Headers({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    });
    
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      method: "PUT",
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      method: "DELETE",
    });
    return handleResponse<T>(response);
  }
};
