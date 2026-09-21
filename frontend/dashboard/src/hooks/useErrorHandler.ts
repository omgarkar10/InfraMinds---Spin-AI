/**
 * useErrorHandler — centralized frontend async error handler.
 *
 * Provides:
 *   - handleApiError(err): formats ApiError into user-facing message
 *   - listenForAuthExpiry(onExpire): registers the auth:expired event
 *
 * Usage:
 *   const { handleApiError } = useErrorHandler();
 *   try { ... } catch (err) { handleApiError(err); }
 */
import { useCallback, useEffect } from "react";
import { ApiError } from "../services/apiClient";

export interface ErrorState {
  message: string;
  status?: number;
  isAuthError: boolean;
}

export function formatApiError(err: unknown): ErrorState {
  if (err instanceof ApiError) {
    return {
      message: err.message,
      status: err.status,
      isAuthError: err.status === 401 || err.status === 403,
    };
  }
  if (err instanceof Error) {
    return { message: err.message, isAuthError: false };
  }
  return { message: "An unexpected error occurred.", isAuthError: false };
}

export function useAuthExpiry(onExpire: () => void) {
  useEffect(() => {
    const handler = () => onExpire();
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [onExpire]);
}

export function useErrorHandler(onError?: (e: ErrorState) => void) {
  const handleApiError = useCallback(
    (err: unknown): ErrorState => {
      const formatted = formatApiError(err);
      if (onError) onError(formatted);
      return formatted;
    },
    [onError]
  );

  return { handleApiError, formatApiError };
}
