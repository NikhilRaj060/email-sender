"use client";
import { useMutation } from "@tanstack/react-query";
import { resumeService } from "@/services/resumeService";
import { toast } from "sonner";

export function useUploadResume() {
  return useMutation({
    mutationFn: resumeService.uploadResume,
    onSuccess: (data) => {
      toast.success(data.message || "Resume uploaded successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to upload resume");
    },
  });
}
