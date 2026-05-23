import api from "@/lib/axios";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post("/api/auth/v1/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<{ message: string }> {
    const { data } = await api.post("/api/auth/v1/register", payload);
    return data;
  },

  async logout(): Promise<void> {
    // Best-effort server logout (fire-and-forget — client clears tokens regardless)
    try {
      await api.post("/api/auth/v1/logout");
    } catch {
      // ignore
    }
  },
};
