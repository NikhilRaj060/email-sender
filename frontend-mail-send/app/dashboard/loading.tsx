export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0b] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading…</p>
      </div>
    </div>
  );
}
