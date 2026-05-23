"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { templateService } from "@/services/templateService";
import { toast } from "sonner";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => templateService.getTemplates(),
    select: (data) => data.templates,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUploadTemplate() {
  return useMutation({
    mutationFn: templateService.uploadTemplate,
    onSuccess: (data) => {
      toast.success(data.message || "Template saved successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to save template");
    },
  });
}

export function useUpdateTemplate() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; content?: string; subjects?: string; file?: File } }) =>
      templateService.updateTemplate(id, payload),
    onSuccess: (data) => {
      toast.success(data.message || "Template updated successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to update template");
    },
  });
}

export function useDeleteTemplate() {
  return useMutation({
    mutationFn: (id: string) => templateService.deleteTemplate(id),
    onSuccess: (data) => {
      toast.success(data.message || "Template deleted successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to delete template");
    },
  });
}
