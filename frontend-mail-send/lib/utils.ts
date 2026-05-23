import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    SENT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
    COOLDOWN: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    SKIPPED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
  return map[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export function getStatusDot(status: string): string {
  const map: Record<string, string> = {
    SENT: "bg-emerald-400",
    FAILED: "bg-red-400",
    COOLDOWN: "bg-amber-400",
    SKIPPED: "bg-zinc-400",
  };
  return map[status] || "bg-zinc-400";
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("accessToken");
}

export function getStoredUserName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("userName") || "";
}
