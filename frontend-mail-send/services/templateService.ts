import api from "@/lib/axios";
import { TemplatesResponse, UploadTemplateResponse, DeleteTemplateResponse } from "@/types";

export const templateService = {
  async getTemplates(): Promise<TemplatesResponse> {
    const { data } = await api.get("/api/email/templates/v1");
    return data;
  },

  async uploadTemplate(payload: {
    name: string;
    content?: string;
    subjects?: string;
    file?: File;
  }): Promise<UploadTemplateResponse> {
    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.content) formData.append("content", payload.content);
    if (payload.subjects) formData.append("subjects", payload.subjects);
    if (payload.file) formData.append("template", payload.file);

    const { data } = await api.post("/api/email/templates/v1/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async updateTemplate(id: string, payload: {
    name: string;
    content?: string;
    subjects?: string;
    file?: File;
  }): Promise<UploadTemplateResponse> {
    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.content !== undefined) formData.append("content", payload.content);
    if (payload.subjects) formData.append("subjects", payload.subjects);
    if (payload.file) formData.append("template", payload.file);

    const { data } = await api.put(`/api/email/templates/v1/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async deleteTemplate(id: string): Promise<DeleteTemplateResponse> {
    const { data } = await api.delete(`/api/email/templates/v1/${id}`);
    return data;
  },
};
