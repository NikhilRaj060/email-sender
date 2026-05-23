import api from "@/lib/axios";
import { EmailConfig, EmailConfigResponse } from "@/types";

export const configService = {
  async saveConfig(payload: EmailConfig): Promise<EmailConfigResponse> {
    const { data } = await api.post("/api/email/config/v1/add/config", payload);
    return data;
  },
};
