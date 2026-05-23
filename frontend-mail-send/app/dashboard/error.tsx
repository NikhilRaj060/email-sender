"use client";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0b] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-white font-semibold">Something went wrong</h2>
        <p className="text-zinc-500 text-sm">{error?.message || "An unexpected error occurred."}</p>
        <button
          onClick={reset}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
