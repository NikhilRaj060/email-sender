"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { emailService } from "@/services/emailService";
import { toast } from "sonner";

export function useDailyStats() {
  return useQuery({
    queryKey: ["daily-stats"],
    queryFn: () => emailService.getDailyStats(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSendEmails() {
  return useMutation({
    mutationFn: ({
      pdf,
      templateId,
      templateName,
    }: {
      pdf: File;
      templateId?: string;
      templateName?: string;
    }) => emailService.sendBulkEmails(pdf, templateId, templateName),
    onSuccess: (data) => {
      const { sent, total, failedCount } = data.summary;
      toast.success(`Done! ${sent}/${total} sent • ${failedCount} failed`);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to send emails");
    },
  });
}

export function useRetryEmails() {
  return useMutation({
    mutationFn: emailService.retryFailedEmails,
    onSuccess: () => toast.success("Retry job started"),
    onError: (err: { message: string }) => toast.error(err.message),
  });
}
