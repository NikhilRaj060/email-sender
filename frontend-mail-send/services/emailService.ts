import api from "@/lib/axios";
import { SendEmailResponse, DailyStat, BulkJob } from "@/types";

export const emailService = {
  async sendBulkEmails(
    pdf: File,
    templateId?: string,
    templateName?: string
  ): Promise<SendEmailResponse> {
    const formData = new FormData();
    formData.append("pdf", pdf);
    if (templateId) formData.append("templateId", templateId);
    if (templateName) formData.append("templateName", templateName);

    const { data } = await api.post("/api/email/send", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async retryFailedEmails(): Promise<{ success: boolean; result: unknown[] }> {
    const { data } = await api.post("/api/email/retry");
    return data;
  },

  async getDailyStats(): Promise<DailyStat[]> {
    const { data } = await api.get("/api/email/stats/daily");
    return data;
  },

  async getLatestJob(): Promise<BulkJob | null> {
    const { data } = await api.get("/api/email/job/latest");
    return data;
  },

  async getJobStatus(jobId: string): Promise<BulkJob> {
    const { data } = await api.get(`/api/email/job/${jobId}`);
    return data;
  },
};
