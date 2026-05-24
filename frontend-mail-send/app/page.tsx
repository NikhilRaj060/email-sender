"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail, Zap, Shield, BarChart3, ArrowRight,
  FileText, Send, RefreshCw, ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "PDF → Contact List",
    description: "Drop any HR contact PDF. We extract names, companies, and emails automatically using AI-powered parsing.",
  },
  {
    icon: Zap,
    title: "Handlebars Personalisation",
    description: "Every email is unique. Use {{name}}, {{company}}, {{role}} variables that resolve per recipient at send time.",
  },
  {
    icon: Send,
    title: "Rate-Limited Bulk Send",
    description: "Send to hundreds of HRs with intelligent cooldown logic that keeps you out of spam folders.",
  },
  {
    icon: BarChart3,
    title: "Daily Analytics",
    description: "Track SENT, FAILED, COOLDOWN, and SKIPPED counts with per-day breakdowns and trend charts.",
  },
  {
    icon: Shield,
    title: "Your SMTP, Your Identity",
    description: "Connect your own Gmail or custom SMTP. Emails come from you, not a shared sender pool.",
  },
  {
    icon: RefreshCw,
    title: "One-Click Retry",
    description: "Failed sends are queued automatically. Retry everything with a single click — no re-uploading needed.",
  },
];

const steps = [
  { n: "01", title: "Upload your resume", body: "We'll attach it to every email automatically." },
  { n: "02", title: "Create a template", body: "Write your outreach email with Handlebars placeholders." },
  { n: "03", title: "Drop the HR PDF", body: "Our AI extracts every contact in seconds." },
  { n: "04", title: "Hit send", body: "Sit back while we deliver personalised emails at scale." },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "5px 12px", borderRadius: "var(--r-full)",
        border: "1px solid rgba(167,139,250,0.3)",
        background: "rgba(124,58,237,0.08)",
        color: "var(--text-accent)", fontSize: 12, fontWeight: 500,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </div>
  );
}

function MockDashboard() {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--r-2xl)",
        overflow: "hidden",
        boxShadow: "0 32px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        minWidth: 640,
      }}
    >
      {/* Titlebar */}
      <div
        style={{
          padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.015)",
        }}
      >
        {["#ef4444","#f59e0b","#22c55e"].map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
        ))}
        <div style={{ flex:1, height:20, background:"rgba(255,255,255,0.04)", borderRadius:6, marginLeft:8 }} />
      </div>

      <div style={{ display:"flex" }}>
        {/* Sidebar */}
        <div style={{ width:160, borderRight:"1px solid var(--border-subtle)", padding:"16px 12px", display:"flex", flexDirection:"column", gap:4 }}>
          {["Dashboard","Send Emails","Templates","Resume","Analytics","Settings"].map((item, i) => (
            <div
              key={item}
              style={{
                padding:"7px 10px", borderRadius:"var(--r-sm)",
                fontSize:12, fontWeight:500,
                background: i===0 ? "rgba(124,58,237,0.12)" : "transparent",
                color: i===0 ? "var(--text-accent)" : "var(--text-muted)",
                display:"flex", alignItems:"center", gap:8,
              }}
            >
              <div style={{ width:14, height:14, borderRadius:3, background: i===0 ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)" }} />
              {item}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:20 }}>
          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
            {[
              { label:"Total Sent", value:"2,841", color:"#34d399" },
              { label:"Failed",     value:"23",    color:"#f87171" },
              { label:"Cooldown",   value:"156",   color:"#fbbf24" },
              { label:"Skipped",    value:"12",    color:"#71717a" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding:"12px", borderRadius:"var(--r-lg)",
                  border:"1px solid var(--border-subtle)",
                  background:"rgba(255,255,255,0.015)",
                }}
              >
                <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:18, fontWeight:700, color:s.color, letterSpacing:"-0.03em" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div
            style={{
              borderRadius:"var(--r-lg)", border:"1px solid var(--border-subtle)",
              padding:"14px", background:"rgba(255,255,255,0.01)",
            }}
          >
            <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:12 }}>Daily Activity</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
              {[40,65,30,85,55,90,45,75,60,95,50,80,70,88].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex:1, borderRadius:"3px 3px 0 0",
                    background: `linear-gradient(to top, #7c3aed, #a78bfa)`,
                    height:`${h}%`, opacity:0.6 + (i/14)*0.4,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)" }}>
      {/* Background radial glow */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.12) 0%, transparent 70%)",
      }} />

      {/* Nav */}
      <nav style={{
        position:"sticky", top:0, zIndex:50,
        borderBottom:"1px solid var(--border-subtle)",
        backdropFilter:"blur(20px)",
        background:"rgba(6,6,8,0.7)",
        padding:"0 32px", height:58,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 12px rgba(124,58,237,0.4)",
          }}>
            <Mail size={14} color="#fff" />
          </div>
          <span style={{ color:"var(--text-primary)", fontWeight:600, fontSize:15, letterSpacing:"-0.02em" }}>
            MailFlow
          </span>
        </Link>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:"clamp(60px, 12vw, 100px) clamp(16px, 4vw, 32px) clamp(48px, 10vw, 80px)", textAlign:"center", position:"relative" }}>
        <motion.div
          initial={{ opacity:0, y:24 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.6, ease:[0.4,0,0.2,1] }}
          style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:28 }}
        >
          <Pill>
            <Zap size={11} /> AI-powered bulk outreach for job seekers
          </Pill>

          <h1 style={{ maxWidth:740, margin:"0 auto" }}>
            Send 100s of job apps
            <br />
            <span className="gradient-text">in minutes, not hours.</span>
          </h1>

          <p style={{ maxWidth:520, fontSize:17, lineHeight:1.7, color:"var(--text-secondary)", margin:"0 auto" }}>
            Upload a PDF of HR contacts, pick a personalised template, and let MailFlow
            blast tailored outreach emails to every recruiter — automatically.
          </p>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">Sign in</Link>
          </div>

          <p style={{ fontSize:12.5, color:"var(--text-muted)" }}>
            No credit card required &nbsp;·&nbsp; Set up in 2 minutes
          </p>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity:0, y:48, scale:0.97 }}
          animate={{ opacity:1, y:0, scale:1 }}
          transition={{ duration:0.9, delay:0.25, ease:[0.4,0,0.2,1] }}
          style={{ maxWidth:860, margin:"64px auto 0", position:"relative", width:"100%", overflowX:"auto" }}
        >
          {/* Glow beneath */}
          <div style={{
            position:"absolute", inset:"20% 10%", bottom:-40,
            background:"rgba(124,58,237,0.2)",
            borderRadius:"50%", filter:"blur(60px)", pointerEvents:"none",
          }} />
          <MockDashboard />
        </motion.div>
      </section>

      {/* How it works */}
      <section style={{ padding:"clamp(48px, 8vw, 80px) clamp(16px, 4vw, 32px)", borderTop:"1px solid var(--border-subtle)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <p style={{ color:"var(--text-accent)", fontSize:13, fontWeight:500, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>
              How it works
            </p>
            <h2 style={{ color:"var(--text-primary)" }}>Four steps to your next interview</h2>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:2 }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.1 }}
                style={{
                  padding:"28px 24px",
                  borderRight: i < steps.length-1 ? "1px solid var(--border-subtle)" : "none",
                  position:"relative",
                }}
              >
                <div style={{
                  fontFamily:"monospace", fontSize:11, fontWeight:700,
                  color:"rgba(124,58,237,0.5)", letterSpacing:"0.1em", marginBottom:16,
                }}>
                  {s.n}
                </div>
                <h3 style={{ color:"var(--text-primary)", marginBottom:8, fontSize:15 }}>{s.title}</h3>
                <p style={{ fontSize:13.5, lineHeight:1.65 }}>{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:"clamp(48px, 8vw, 80px) clamp(16px, 4vw, 32px)", borderTop:"1px solid var(--border-subtle)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <p style={{ color:"var(--text-accent)", fontSize:13, fontWeight:500, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>
              Platform
            </p>
            <h2 style={{ color:"var(--text-primary)", marginBottom:14 }}>Everything you need</h2>
            <p style={{ fontSize:16, color:"var(--text-secondary)", maxWidth:420, margin:"0 auto" }}>
              Built specifically for job seekers who want results, not another email marketing SaaS.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity:0, y:20 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.07 }}
                  className="card card-hover"
                  style={{ padding:"24px" }}
                >
                  <div style={{
                    width:36, height:36, borderRadius:"var(--r-md)",
                    background:"var(--accent-subtle)", border:"1px solid var(--border-accent)",
                    display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16,
                  }}>
                    <Icon size={16} color="var(--text-accent)" />
                  </div>
                  <h3 style={{ color:"var(--text-primary)", marginBottom:8 }}>{f.title}</h3>
                  <p style={{ fontSize:13.5, lineHeight:1.65 }}>{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"clamp(48px, 8vw, 80px) clamp(16px, 4vw, 32px)", borderTop:"1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth:600, margin:"0 auto", textAlign:"center" }}>
          <div
            className="card"
            style={{
              padding:"clamp(32px, 6vw, 56px) clamp(20px, 6vw, 48px)",
              background:"linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(79,70,229,0.06) 100%)",
              border:"1px solid var(--border-accent)",
              boxShadow:"0 0 80px -30px rgba(124,58,237,0.3)",
            }}
          >
            <h2 style={{ color:"var(--text-primary)", marginBottom:16 }}>
              Ready to automate your job hunt?
            </h2>
            <p style={{ marginBottom:32, fontSize:16, lineHeight:1.7 }}>
              Set up in under 2 minutes. Connect your SMTP, upload your resume,
              and start reaching HRs at scale.
            </p>
            <Link href="/register" className="btn btn-primary btn-lg">
              Get started — it&apos;s free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop:"1px solid var(--border-subtle)",
        padding:"28px clamp(16px, 4vw, 32px)",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:24, height:24, borderRadius:6,
            background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Mail size={11} color="#fff" />
          </div>
          <span style={{ color:"var(--text-muted)", fontSize:13, fontWeight:500 }}>MailFlow</span>
        </div>
        <p style={{ color:"var(--text-muted)", fontSize:12.5 }}>
          © 2026 MailFlow. Built for job seekers, by job seekers.
        </p>
        <div style={{ display:"flex", gap:20 }}>
          {["Privacy","Terms","Support"].map((item) => (
            <Link
              key={item} href="#"
              style={{ color:"var(--text-muted)", fontSize:12.5, textDecoration:"none", transition:"color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {item}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
