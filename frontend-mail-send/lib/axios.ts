import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, RefreshResponse } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ─── Token helpers (localStorage — works outside React context) ───────────────
function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userName");
  // Also clear Zustand persisted state
  localStorage.removeItem("auth-storage");
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// ─── Refresh token queue ───────────────────────────────────────────────────────
// If multiple requests 401 at the same time, we only want ONE refresh call.
// The rest queue up and get resolved/rejected when the refresh completes.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

// ─── Request interceptor — attach access token ────────────────────────────────
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — silent refresh on 401 ─────────────────────────────
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string; errorMessage?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(normalizeError(error));
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalRequest));
          },
          reject,
        });
      });
    }

    // Mark as retried so we don't loop if the refresh itself 401s
    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken = getRefreshToken();

    if (!storedRefreshToken) {
      isRefreshing = false;
      processQueue(new Error("No refresh token"), null);
      clearTokens();
      redirectToLogin();
      return Promise.reject(normalizeError(error));
    }

    try {
      // Call refresh endpoint with a plain axios (not the instance) to avoid
      // triggering this interceptor again on its own 401.
      const { data } = await axios.post<RefreshResponse>(
        `${BASE_URL}/api/auth/v1/refresh`,
        { refreshToken: storedRefreshToken },
        { timeout: 10000 }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;

      // Persist new tokens
      setTokens(newAccessToken, newRefreshToken);

      // Update the Zustand store (best-effort — store might not be available SSR)
      try {
        const { useAuthStore } = await import("@/store/authStore");
        useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
      } catch {
        // not critical — localStorage is the source of truth for the interceptor
      }

      // Resume all queued requests with the new token
      processQueue(null, newAccessToken);

      // Retry the original failed request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Refresh itself failed (token expired/revoked) — force logout
      processQueue(refreshError, null);
      clearTokens();
      redirectToLogin();
      return Promise.reject(normalizeError(error));
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Error normalization ───────────────────────────────────────────────────────
function normalizeError(
  error: AxiosError<{ message?: string; errorMessage?: string }>
): ApiError {
  return {
    message:
      error.response?.data?.errorMessage ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong",
    errorMessage: error.response?.data?.errorMessage,
    statusCode: error.response?.status,
  };
}

export default axiosInstance;
