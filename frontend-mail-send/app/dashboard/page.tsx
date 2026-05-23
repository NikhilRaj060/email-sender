"use client";
import { useDailyStats } from "@/hooks/useEmail";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthStore } from "@/store/authStore";
import { Send, AlertCircle, Clock, SkipForward, TrendingUp, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { DailyStat } from "@/types";
import { motion } from "framer-motion";

function computeTotals(stats: DailyStat[]) {
  let sent = 0, failed = 0, cooldown = 0, skipped = 0;
  for (const day of stats) {
    for (const c of day.counts) {
      if (c.status === "SENT") sent += c.count;
      else if (c.status === "FAILED") failed += c.count;
      else if (c.status === "COOLDOWN") cooldown += c.count;
      else if (c.status === "SKIPPED") skipped += c.count;
    }
  }
  return { sent, failed, cooldown, skipped };
}

function buildChartData(stats: DailyStat[]) {
  return stats.slice().reverse().slice(-14).map((day) => {
    const row: Record<string, string | number> = { date: day._id.slice(5) };
    for (const c of day.counts) row[c.status] = c.count;
    return row;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"var(--bg-elevated)", border:"1px solid var(--border-default)",
      borderRadius:"var(--r-lg)", padding:"12px 14px", fontSize:12,
      boxShadow:"var(--shadow-lg)",
    }}>
      <p style={{ color:"var(--text-muted)", marginBottom:8, fontWeight:500 }}>{label}</p>
      {payload.map((p: { color: string; name: string; value: number }) => (
        <div key={p.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:p.color, display:"inline-block" }} />
          <span style={{ color:"var(--text-secondary)" }}>{p.name}</span>
          <span style={{ color:"var(--text-primary)", fontWeight:600, marginLeft:"auto", paddingLeft:12 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface StatCardProps {
  readonly label: string;
  readonly value: number;
  readonly icon: React.ElementType;
  readonly color: string;
  readonly sub: string;
  readonly delay: number;
}

function StatCard({ label, value, icon: Icon, color, sub, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.35 }}
      style={{
        background:"var(--bg-surface)",
        border:"1px solid var(--border-subtle)",
        borderRadius:"var(--r-xl)",
        padding:"20px 22px",
        display:"flex", flexDirection:"column", gap:12,
        boxShadow:"var(--shadow-card)",
        transition:"var(--t-smooth)",
        cursor:"default",
      }}
      onHoverStart={(e) => {
        (e.target as HTMLElement).closest?.("div")?.setAttribute("style",
          "background:var(--bg-elevated); border-color:var(--border-default); transform:translateY(-1px);");
      }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:12.5, color:"var(--text-muted)", fontWeight:500 }}>{label}</span>
        <div style={{
          width:30, height:30, borderRadius:"var(--r-sm)",
          background:`${color}12`, border:`1px solid ${color}25`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div>
        <div style={{ fontSize:28, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.04em", lineHeight:1 }}>
          {value.toLocaleString()}
        </div>
        <div style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:6 }}>{sub}</div>
      </div>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div style={{
      background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
      borderRadius:"var(--r-xl)", padding:"20px 22px",
      display:"flex", flexDirection:"column", gap:14,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <div className="skeleton" style={{ width:70, height:13 }} />
        <div className="skeleton" style={{ width:30, height:30, borderRadius:6 }} />
      </div>
      <div className="skeleton" style={{ width:80, height:28 }} />
      <div className="skeleton" style={{ width:50, height:11 }} />
    </div>
  );
}


export default function DashboardPage() {
  const { userName } = useAuthStore();
  const { data: stats, isLoading, error } = useDailyStats();

  const totals    = stats ? computeTotals(stats) : null;
  const chartData = stats ? buildChartData(stats) : [];
  const hour      = new Date().getHours();
  
  let greeting: string;
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  const statCards = [
    { label:"Total Sent",   value:totals?.sent     ?? 0, icon:Send,        color:"#34d399", sub:"All time",      delay:0.06 },
    { label:"Failed",       value:totals?.failed   ?? 0, icon:AlertCircle, color:"#f87171", sub:"Eligible retry", delay:0.12 },
    { label:"Cooldown",     value:totals?.cooldown ?? 0, icon:Clock,       color:"#fbbf24", sub:"Rate limited",   delay:0.18 },
    { label:"Skipped",      value:totals?.skipped  ?? 0, icon:SkipForward, color:"#71717a", sub:"Missing data",   delay:0.24 },
  ];

  const quickActions = [
    { href:"/dashboard/send",      label:"Send Emails",      desc:"Upload PDF & blast", grad:"#7c3aed,#5b21b6" },
    { href:"/dashboard/templates", label:"Manage Templates", desc:"Create or update",   grad:"#059669,#047857" },
    { href:"/dashboard/resume",    label:"Upload Resume",    desc:"Attach your CV",     grad:"#d97706,#b45309" },
  ];

  return (
    <DashboardShell
      title={`${greeting}, ${userName?.split(" ")[0] || "there"} 👋`}
      description="Here's your email activity at a glance."
    >
      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom:28 }}>
        {isLoading
          ? Array.from({ length:4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity:0, y:14 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay:0.3 }}
        style={{
          background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
          borderRadius:"var(--r-xl)", padding:"24px 26px",
          boxShadow:"var(--shadow-card)", marginBottom:20,
        }}
      >
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <TrendingUp size={15} color="var(--text-accent)" />
            <span style={{ color:"var(--text-primary)", fontWeight:500, fontSize:14 }}>Daily activity — last 14 days</span>
          </div>
          <div style={{ display:"flex", gap:16 }}>
            {[
              { c:"#34d399", l:"Sent" }, { c:"#f87171", l:"Failed" },
              { c:"#fbbf24", l:"Cooldown" }, { c:"#71717a", l:"Skipped" },
            ].map((x) => (
              <div key={x.l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:x.c, display:"inline-block" }} />
                <span style={{ fontSize:11.5, color:"var(--text-muted)" }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:24, height:24, border:"2px solid var(--accent)", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", fontSize:13 }}>
            Could not load analytics
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height:180, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
            <Send size={22} color="var(--text-muted)" />
            <p style={{ color:"var(--text-muted)", fontSize:13 }}>No data yet — send your first batch!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill:"#55555f", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#55555f", fontSize:11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(255,255,255,0.03)" }} />
              <Bar dataKey="SENT"     fill="#34d399" radius={[3,3,0,0]} />
              <Bar dataKey="FAILED"   fill="#f87171" radius={[3,3,0,0]} />
              <Bar dataKey="COOLDOWN" fill="#fbbf24" radius={[3,3,0,0]} />
              <Bar dataKey="SKIPPED"  fill="#52525b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity:0, y:14 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay:0.4 }}
        style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:14 }}
      >
        {quickActions.map((a) => (
          <a
            key={a.href} href={a.href}
            style={{
              display:"flex", flexDirection:"column", gap:10,
              padding:"18px 20px", borderRadius:"var(--r-xl)",
              background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
              textDecoration:"none", transition:"var(--t-smooth)",
              boxShadow:"var(--shadow-card)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--bg-elevated)";
              el.style.borderColor = "var(--border-default)";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--bg-surface)";
              el.style.borderColor = "var(--border-subtle)";
              el.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width:34, height:34, borderRadius:"var(--r-md)",
              background:`linear-gradient(135deg, ${a.grad})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 4px 12px ${a.grad.split(",")[0]}40`,
            }}>
              <Send size={14} color="#fff" />
            </div>
            <div>
              <p style={{ color:"var(--text-primary)", fontSize:13.5, fontWeight:500, marginBottom:3 }}>{a.label}</p>
              <p style={{ color:"var(--text-muted)", fontSize:12 }}>{a.desc}</p>
            </div>
            <ArrowRight size={13} color="var(--text-muted)" style={{ marginTop:"auto" }} />
          </a>
        ))}
      </motion.div>
    </DashboardShell>
  );
}
