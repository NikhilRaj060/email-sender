import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  iconColor?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  iconColor = "text-violet-400",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-400 text-sm">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-white tracking-tight">{value}</div>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}
