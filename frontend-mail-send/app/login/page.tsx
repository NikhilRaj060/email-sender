"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      login(data.accessToken || data.token, data.refreshToken || "", data.name);
      toast.success(`Welcome back, ${data.name}!`);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg-base)" }}>
      {/* Left decorative panel */}
      <div style={{
        width:440,
        background:"linear-gradient(160deg, rgba(124,58,237,0.07) 0%, transparent 60%)",
        borderRight:"1px solid var(--border-subtle)",
        padding:"40px 48px",
        flexDirection:"column",
        justifyContent:"space-between",
      }}
      className="lg-panel"
      >
        <style>{`.lg-panel { display: none; } @media (min-width:1024px) { .lg-panel { display: flex !important; } }`}</style>

        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Mail size={14} color="#fff" />
          </div>
          <span style={{ color:"var(--text-primary)", fontWeight:600, fontSize:15, letterSpacing:"-0.02em" }}>MailFlow</span>
        </Link>

        <div>
          <div style={{
            background:"rgba(255,255,255,0.03)",
            border:"1px solid var(--border-default)",
            borderRadius:"var(--r-xl)",
            padding:"24px",
            marginBottom:28,
          }}>
            <p style={{ color:"var(--text-secondary)", lineHeight:1.7, fontSize:15, marginBottom:16 }}>
              &ldquo;MailFlow helped me send personalised emails to 200+ companies in under 10 minutes.
              Got 3 interviews that week.&rdquo;
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:13, fontWeight:700,
              }}>NR</div>
              <div>
                <p style={{ color:"var(--text-primary)", fontSize:13, fontWeight:500 }}>Nikhil R.</p>
                <p style={{ color:"var(--text-muted)", fontSize:12 }}>Software Engineer</p>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              "Automated bulk email with cooldown protection",
              "Personalised Handlebars templates",
              "Daily analytics and retry on failure",
            ].map((item) => (
              <div key={item} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{
                  width:18, height:18, borderRadius:"50%", flexShrink:0,
                  background:"var(--accent-subtle)", border:"1px solid var(--border-accent)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2 2 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ color:"var(--text-secondary)", fontSize:13 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.45, ease:[0.4,0,0.2,1] }}
          style={{ width:"100%", maxWidth:368 }}
        >
          {/* Back link */}
          <Link href="/"
            style={{
              display:"inline-flex", alignItems:"center", gap:6, marginBottom:32,
              color:"var(--text-muted)", fontSize:13, textDecoration:"none",
              transition:"color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft size={13} /> Back to home
          </Link>

          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontSize:26, marginBottom:6, color:"var(--text-primary)" }}>Welcome back</h1>
            <p style={{ fontSize:14, color:"var(--text-muted)" }}>Sign in to your MailFlow account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-secondary)", marginBottom:7 }}>
                Email address
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                <label style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)" }}>Password</label>
              </div>
              <div style={{ position:"relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  style={{ paddingRight:42 }}
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  style={{
                    position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer",
                    color:"var(--text-muted)", padding:4,
                    display:"flex", alignItems:"center",
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                  exit={{ opacity:0, height:0 }} className="alert alert-error"
                  style={{ fontSize:13 }}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink:0 }}>
                    <circle cx="7.5" cy="7.5" r="6.5" stroke="#f87171" strokeWidth="1.2"/>
                    <path d="M7.5 4.5v3.5M7.5 10.5h.01" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary"
              style={{ width:"100%", justifyContent:"center", marginTop:4, padding:"11px" }}
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : "Sign in"}
            </button>
          </form>

          <p style={{ textAlign:"center", fontSize:13, color:"var(--text-muted)", marginTop:24 }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color:"var(--text-accent)", textDecoration:"none", fontWeight:500 }}>
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
