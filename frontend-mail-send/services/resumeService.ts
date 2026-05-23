import api from "@/lib/axios";
import { ResumeUploadResponse } from "@/types";

export const resumeService = {
  async uploadResume(file: File): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append("resume", file);

    const { data } = await api.post("/api/resume/v1/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
