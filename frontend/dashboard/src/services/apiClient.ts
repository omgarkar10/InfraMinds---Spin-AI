/**
 * apiClient — centralized HTTP client for the SPIN frontend.
 *
 * Token injection:
 *   - Automatically injects Bearer token from localStorage when present.
 *   - Staff routes use 'staff_token'; citizen routes use 'citizen_token'.
 *   - The injected token is determined by which one is currently stored.
 *   - Set requireAuth: true on options to enforce auth (throws ApiError 401 if missing).
 *
 * Error handling:
 *   - 401 responses clear local tokens and dispatch a custom 'auth:expired' event.
 *   - 403 responses throw ApiError with the server's detail message.
 *   - All non-OK responses throw ApiError with status + message.
 */
import { API_BASE } from "../config";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  /** If true and no token is found, throws ApiError 401 before sending the request. */
  requireAuth?: boolean;
}

function getAuthToken(): string | null {
  return (
    localStorage.getItem("staff_token") ||
    localStorage.getItem("citizen_token") ||
    null
  );
}

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers({ "Content-Type": "application/json", ...(extra || {}) });
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

function handleAuthError(status: number): void {
  if (status === 401) {
    // Clear stale tokens and notify app-level listeners
    localStorage.removeItem("staff_token");
    localStorage.removeItem("citizen_token");
    window.dispatchEvent(new CustomEvent("auth:expired"));
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    handleAuthError(response.status);
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.error || errorMessage;
    } catch {
      // Non-JSON error body — use default message
    }
    throw new ApiError(response.status, errorMessage);
  }
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Failed to parse API response as JSON");
  }
}

export const apiClient = {
  async get<T>(path: string, options: FetchOptions = {}): Promise<T> {
    if (options.requireAuth && !getAuthToken()) {
      throw new ApiError(401, "Authentication required.");
    }
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: buildHeaders(options.headers),
      method: "GET",
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body: unknown, options: FetchOptions = {}): Promise<T> {
    if (options.requireAuth && !getAuthToken()) {
      throw new ApiError(401, "Authentication required.");
    }
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: buildHeaders(options.headers),
      method: "POST",
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body: unknown, options: FetchOptions = {}): Promise<T> {
    if (options.requireAuth && !getAuthToken()) {
      throw new ApiError(401, "Authentication required.");
    }
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: buildHeaders(options.headers),
      method: "PUT",
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string, options: FetchOptions = {}): Promise<T> {
    if (options.requireAuth && !getAuthToken()) {
      throw new ApiError(401, "Authentication required.");
    }
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: buildHeaders(options.headers),
      method: "DELETE",
    });
    return handleResponse<T>(response);
  },
};
