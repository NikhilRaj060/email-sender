import { cn, getStatusColor } from "@/lib/utils";
import { EmailStatus } from "@/types";

export function StatusBadge({ status }: { status: EmailStatus | string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStatusColor(status)
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
