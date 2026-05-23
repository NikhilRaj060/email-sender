"use client";
import { useMutation } from "@tanstack/react-query";
import { configService } from "@/services/configService";
import { EmailConfig } from "@/types";
import { toast } from "sonner";

export function useSaveConfig() {
  return useMutation({
    mutationFn: (payload: EmailConfig) => configService.saveConfig(payload),
    onSuccess: (data) => {
      toast.success(data.message || "Configuration saved");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to save configuration");
    },
  });
}
