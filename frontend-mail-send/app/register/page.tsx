"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Eye, EyeOff, Loader2, ArrowLeft, Check } from "lucide-react";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const data = await authService.register({ name, email, password, confirmPassword });
      setSuccess(true);
      toast.success(data.message || "Account created!");
      setTimeout(() => router.push("/login"), 1600);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ["","#f87171","#fbbf24","#34d399"][pwStrength];
  const strengthLabel = ["","Weak","Fair","Strong"][pwStrength];

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg-base)" }}>
      {/* Left panel */}
      <div
        className="lg-panel"
        style={{
          width:440,
          background:"linear-gradient(160deg, rgba(124,58,237,0.07) 0%, transparent 60%)",
          borderRight:"1px solid var(--border-subtle)",
          padding:"40px 48px",
          flexDirection:"column",
          justifyContent:"space-between",
        }}
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
          <h2 style={{ color:"var(--text-primary)", fontSize:22, marginBottom:20, lineHeight:1.3 }}>
            Automate your job applications in minutes
          </h2>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              "Upload a PDF of HR contacts",
              "Personalised templates with Handlebars",
              "Intelligent cooldown and retry",
              "Track every email in real time",
              "Your own SMTP — full control",
            ].map((item) => (
              <div key={item} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{
                  width:18, height:18, borderRadius:"50%", flexShrink:0,
                  background:"var(--accent-subtle)", border:"1px solid var(--border-accent)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <Check size={9} color="#a78bfa" />
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
          style={{ width:"100%", maxWidth:380 }}
        >
          {success ? (
            <motion.div
              initial={{ opacity:0, scale:0.93 }}
              animate={{ opacity:1, scale:1 }}
              style={{ textAlign:"center", padding:"40px 0" }}
            >
              <div style={{
                width:56, height:56, borderRadius:"50%", margin:"0 auto 20px",
                background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <Check size={24} color="#34d399" />
              </div>
              <h2 style={{ color:"var(--text-primary)", marginBottom:8, fontSize:22 }}>Account created!</h2>
              <p style={{ fontSize:14, color:"var(--text-muted)" }}>Redirecting you to sign in…</p>
            </motion.div>
          ) : (
            <>
              <Link href="/"
                style={{
                  display:"inline-flex", alignItems:"center", gap:6, marginBottom:32,
                  color:"var(--text-muted)", fontSize:13, textDecoration:"none",
                }}
              >
                <ArrowLeft size={13} /> Back to home
              </Link>

              <div style={{ marginBottom:32 }}>
                <h1 style={{ fontSize:26, marginBottom:6, color:"var(--text-primary)" }}>Create your account</h1>
                <p style={{ fontSize:14, color:"var(--text-muted)" }}>Start sending smarter job applications</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-secondary)", marginBottom:7 }}>
                    Full name
                  </label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Nikhil Raj" required autoComplete="name"
                  />
                </div>

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
                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-secondary)", marginBottom:7 }}>
                    Password
                  </label>
                  <div style={{ position:"relative" }}>
                    <input
                      type={showPw ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" required minLength={8}
                      style={{ paddingRight:42 }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{
                        position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                        background:"none", border:"none", cursor:"pointer",
                        color:"var(--text-muted)", padding:4, display:"flex", alignItems:"center",
                      }}
                    >
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:3, borderRadius:10, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                        <div style={{
                          width:`${(pwStrength/3)*100}%`, height:"100%",
                          background:strengthColor, borderRadius:10,
                          transition:"all 0.3s ease",
                        }} />
                      </div>
                      <span style={{ fontSize:11, color:strengthColor, fontWeight:500, minWidth:36 }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-secondary)", marginBottom:7 }}>
                    Confirm password
                  </label>
                  <input
                    type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" required
                    style={{
                      borderColor: confirmPassword.length > 0 && confirmPassword !== password
                        ? "rgba(248,113,113,0.4)" : undefined,
                    }}
                  />
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
                  {loading ? <><Loader2 size={14} className="animate-spin"/> Creating account…</> : "Create account"}
                </button>
              </form>

              <p style={{ textAlign:"center", fontSize:13, color:"var(--text-muted)", marginTop:24 }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color:"var(--text-accent)", textDecoration:"none", fontWeight:500 }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
