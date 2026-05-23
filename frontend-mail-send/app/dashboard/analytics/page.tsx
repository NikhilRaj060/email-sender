"use client";
import DashboardShell from "@/components/layout/DashboardShell";
import { useDailyStats } from "@/hooks/useEmail";
import { Send, AlertCircle, Clock, SkipForward, TrendingUp, CalendarDays, Activity } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { DailyStat } from "@/types";
import { motion } from "framer-motion";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function computeTotals(stats: DailyStat[]) {
  let sent = 0, failed = 0, cooldown = 0, skipped = 0;
  for (const d of stats) {
    for (const c of d.counts) {
      if (c.status === "SENT") sent += c.count;
      else if (c.status === "FAILED") failed += c.count;
      else if (c.status === "COOLDOWN") cooldown += c.count;
      else if (c.status === "SKIPPED") skipped += c.count;
    }
  }
  return { sent, failed, cooldown, skipped };
}

function buildSeries(stats: DailyStat[]) {
  return stats
    .slice()
    .reverse()
    .map((d) => {
      const row: Record<string, string | number> = { date: d._id.slice(5) };
      for (const c of d.counts) row[c.status] = c.count;
      return row;
    });
}

/* ─── Custom tooltip ─────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
      borderRadius: "var(--r-lg)", padding: "12px 14px", fontSize: 12,
      boxShadow: "var(--shadow-lg)", minWidth: 140,
    }}>
      <p style={{ color: "var(--text-muted)", fontWeight: 600, marginBottom: 8, fontSize: 11, letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map((p: { color: string; name: string; value: number }) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "var(--text-secondary)", flex: 1 }}>{p.name}</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
      borderRadius: "var(--r-xl)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ width: 70, height: 13 }} />
        <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ width: 80, height: 28 }} />
      <div className="skeleton" style={{ width: 50, height: 11 }} />
    </div>
  );
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    SENT: "badge-sent", FAILED: "badge-failed", COOLDOWN: "badge-cooldown", SKIPPED: "badge-skipped",
  };
  return <span className={`badge badge-dot ${cls[status] ?? "badge-skipped"}`}>{status}</span>;
}

/* ─── Chart section wrapper ──────────────────────────────────────────────── */
function ChartCard({ title, icon: Icon, delay = 0, children }: {
  title: string; icon: React.ElementType; delay?: number; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-xl)", padding: "24px 26px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22 }}>
        <Icon size={15} color="var(--text-accent)" />
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Chart legend ───────────────────────────────────────────────────────── */
function Legend() {
  return (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
      {[
        { c: "#34d399", l: "Sent" }, { c: "#f87171", l: "Failed" },
        { c: "#fbbf24", l: "Cooldown" }, { c: "#71717a", l: "Skipped" },
      ].map((x) => (
        <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: x.c, display: "inline-block" }} />
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{x.l}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { data: stats, isLoading } = useDailyStats();

  const totals = stats ? computeTotals(stats) : null;
  const series = stats ? buildSeries(stats) : [];
  const total  = totals ? Object.values(totals).reduce((a, b) => a + b, 0) : 0;
  const deliveryRate = total > 0 ? ((totals!.sent / total) * 100) : 0;

  const metricCards = [
    { label: "Total Sent",   value: totals?.sent     ?? 0, icon: Send,        color: "#34d399", sub: "All time",       delay: 0.06 },
    { label: "Failed",       value: totals?.failed   ?? 0, icon: AlertCircle, color: "#f87171", sub: "Can retry",      delay: 0.12 },
    { label: "Cooldown",     value: totals?.cooldown ?? 0, icon: Clock,       color: "#fbbf24", sub: "Rate limited",   delay: 0.18 },
    { label: "Skipped",      value: totals?.skipped  ?? 0, icon: SkipForward, color: "#71717a", sub: "Missing fields", delay: 0.24 },
  ];

  return (
    <DashboardShell
      title="Analytics"
      description="Detailed breakdown of your email sending history."
    >
      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : metricCards.map(({ label, value, icon: Icon, color, sub, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.35 }}
              style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: "var(--r-xl)", padding: "20px 22px",
                boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
                <div style={{
                  width: 30, height: 30, borderRadius: "var(--r-sm)",
                  background: `${color}12`, border: `1px solid ${color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={14} color={color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {value.toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>{sub}</div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* ── Delivery rate bar ───────────────────────────────────────────── */}
      {!isLoading && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: "var(--r-xl)", padding: "20px 24px",
            boxShadow: "var(--shadow-card)", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 24,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginBottom: 4 }}>Delivery Rate</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {deliveryRate.toFixed(1)}%
            </p>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5 }}>
              {totals?.sent.toLocaleString()} of {total.toLocaleString()} attempts
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              height: 6, borderRadius: "var(--r-full)",
              background: "rgba(255,255,255,0.06)", overflow: "hidden",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${deliveryRate}%` }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  height: "100%", borderRadius: "var(--r-full)",
                  background: "linear-gradient(90deg, #7c3aed 0%, #34d399 100%)",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>0%</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>100%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Area chart ─────────────────────────────────────────────────── */}
      <ChartCard title="Email Activity Over Time" icon={TrendingUp} delay={0.32}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <Legend />
        </div>
        {isLoading ? (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 24, height: 24, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : series.length === 0 ? (
          <div style={{ height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Activity size={24} color="var(--text-muted)" />
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No data yet — send your first batch!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {[
                  { id: "sentGrad", color: "#34d399" },
                  { id: "failedGrad", color: "#f87171" },
                ].map(({ id, color }) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#55555f", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#55555f", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="SENT"     stroke="#34d399" strokeWidth={2} fill="url(#sentGrad)" />
              <Area type="monotone" dataKey="FAILED"   stroke="#f87171" strokeWidth={2} fill="url(#failedGrad)" />
              <Area type="monotone" dataKey="COOLDOWN" stroke="#fbbf24" strokeWidth={1.5} fill="none" strokeDasharray="5 3" />
              <Area type="monotone" dataKey="SKIPPED"  stroke="#52525b" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Bar chart breakdown ─────────────────────────────────────────── */}
      {!isLoading && series.length > 0 && (
        <ChartCard title="Daily Volume Breakdown" icon={BarChart as unknown as React.ElementType} delay={0.42} >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={series.slice(-14)} barSize={10} barGap={2} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#55555f", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#55555f", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="SENT"     fill="#34d399" radius={[3, 3, 0, 0]} />
              <Bar dataKey="FAILED"   fill="#f87171" radius={[3, 3, 0, 0]} />
              <Bar dataKey="COOLDOWN" fill="#fbbf24" radius={[3, 3, 0, 0]} />
              <Bar dataKey="SKIPPED"  fill="#52525b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Day-by-day table ────────────────────────────────────────────── */}
      {!isLoading && stats && stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          style={{ marginTop: 20 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <CalendarDays size={15} color="var(--text-accent)" />
            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14 }}>Day-by-Day Breakdown</span>
          </div>

          <div className="table-container">
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    {["SENT", "FAILED", "COOLDOWN", "SKIPPED"].map((s) => (
                      <th key={s} style={{ textAlign: "right" }}>
                        <StatusBadge status={s} />
                      </th>
                    ))}
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((day) => {
                    const counts = Object.fromEntries(day.counts.map((c) => [c.status, c.count]));
                    const dayTotal = day.counts.reduce((a, c) => a + c.count, 0);
                    return (
                      <tr key={day._id}>
                        <td className="mono" style={{ color: "var(--text-secondary)", fontSize: 12.5 }}>{day._id}</td>
                        {["SENT", "FAILED", "COOLDOWN", "SKIPPED"].map((s) => (
                          <td key={s} style={{ textAlign: "right", color: counts[s] ? "var(--text-primary)" : "var(--text-muted)" }}>
                            {counts[s] ?? "—"}
                          </td>
                        ))}
                        <td style={{ textAlign: "right", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {dayTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </DashboardShell>
  );
}
