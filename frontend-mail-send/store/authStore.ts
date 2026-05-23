"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, name: string) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userName: null,
      isAuthenticated: false,

      login: (accessToken, refreshToken, name) => {
        // Keep localStorage in sync so the axios interceptor (which runs
        // outside React context) can read the tokens without importing the store.
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userName", name);
        set({ accessToken, refreshToken, userName: name, isAuthenticated: true });
      },

      updateTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ accessToken, refreshToken });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userName");
        set({
          accessToken: null,
          refreshToken: null,
          userName: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userName: state.userName,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
