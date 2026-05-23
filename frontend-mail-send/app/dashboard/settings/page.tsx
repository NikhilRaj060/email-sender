"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { useSaveConfig } from "@/hooks/useConfig";
import { EmailConfig } from "@/types";
import {
  Settings2, Shield, Eye, EyeOff, CheckCircle2,
  Server, User, Lock, Mail, Loader2, ExternalLink,
} from "lucide-react";

const defaultConfig: EmailConfig = {
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  fromEmail: "",
};

/* ─── Reusable labelled input ─────────────────────────────────────────────── */
function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{hint}</p>
      )}
    </div>
  );
}

/* ─── Section card wrapper ────────────────────────────────────────────────── */
function Section({
  icon: Icon, title, subtitle, delay = 0, children,
}: {
  icon: React.ElementType; title: string; subtitle: string; delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-xl)", overflow: "hidden", boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Card header */}
      <div style={{
        padding: "18px 24px", borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 14,
        background: "rgba(255,255,255,0.012)",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "var(--r-md)", flexShrink: 0,
          background: "var(--accent-subtle)", border: "1px solid var(--border-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={15} color="var(--text-accent)" />
        </div>
        <div>
          <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
            {title}
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>{subtitle}</p>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "24px" }}>{children}</div>
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveMutation = useSaveConfig();

  const handleChange = (field: keyof EmailConfig, value: string | number) => {
    setSaved(false);
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveMutation.mutateAsync(config);
      setSaved(true);
    } catch { /* toast handled in hook */ }
  };

  return (
    <DashboardShell
      title="Settings"
      description="Configure your SMTP server and sender identity."
    >
      <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Server settings ────────────────────────────────────────── */}
        <Section
          icon={Server}
          title="SMTP Server"
          subtitle="Connection details for your outgoing mail server"
          delay={0.06}
        >
          <div className="form-grid" style={{ gap: 16 }}>
            <Field
              label="Host"
              hint="Your SMTP server hostname."
            >
              <input
                type="text"
                value={config.smtpHost}
                onChange={(e) => handleChange("smtpHost", e.target.value)}
                placeholder="smtp.gmail.com"
                className="mono"
              />
            </Field>

            <Field
              label="Port"
              hint="Usually 587 (TLS) or 465 (SSL)."
            >
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={config.smtpPort}
                  onChange={(e) => handleChange("smtpPort", parseInt(e.target.value) || 587)}
                  placeholder="587"
                  className="mono"
                />
              </div>
            </Field>
          </div>

          {/* Preset chips */}
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>Quick presets:</p>
            {[
              { label: "Gmail",   host: "smtp.gmail.com",    port: 587 },
              { label: "Outlook", host: "smtp.outlook.com",  port: 587 },
              { label: "Yahoo",   host: "smtp.mail.yahoo.com", port: 587 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setSaved(false);
                  setConfig((prev) => ({ ...prev, smtpHost: p.host, smtpPort: p.port }));
                }}
                style={{
                  background: config.smtpHost === p.host
                    ? "rgba(124,58,237,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${config.smtpHost === p.host ? "rgba(124,58,237,0.35)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--r-full)",
                  padding: "4px 12px",
                  fontSize: 12, fontWeight: 500,
                  color: config.smtpHost === p.host ? "var(--text-accent)" : "var(--text-muted)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Credentials ────────────────────────────────────────────── */}
        <Section
          icon={User}
          title="Credentials"
          subtitle="Your SMTP login — use App Passwords for Gmail"
          delay={0.14}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="SMTP Username" hint="Usually the same as your email address.">
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={config.smtpUser}
                  onChange={(e) => handleChange("smtpUser", e.target.value)}
                  placeholder="you@gmail.com"
                  required
                  style={{ paddingLeft: 38 }}
                />
                <Mail size={14} color="var(--text-muted)" style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none",
                }} />
              </div>
            </Field>

            <Field label="SMTP Password / App Password" hint="For Gmail, use an App Password — not your account password.">
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={config.smtpPass}
                  onChange={(e) => handleChange("smtpPass", e.target.value)}
                  placeholder="16-character app password"
                  required
                  className="mono"
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                />
                <Lock size={14} color="var(--text-muted)" style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none",
                }} />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: 4,
                    display: "flex", alignItems: "center",
                    transition: "color 0.12s",
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Sender identity ────────────────────────────────────────── */}
        <Section
          icon={Mail}
          title="Sender Identity"
          subtitle="The 'From' address recipients will see"
          delay={0.22}
        >
          <Field
            label="From Email Address"
            hint="Usually the same as your SMTP username."
          >
            <div style={{ position: "relative" }}>
              <input
                type="email"
                value={config.fromEmail}
                onChange={(e) => handleChange("fromEmail", e.target.value)}
                placeholder="you@gmail.com"
                required
                style={{ paddingLeft: 38 }}
              />
              <Mail size={14} color="var(--text-muted)" style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none",
              }} />
            </div>
          </Field>
        </Section>

        {/* ── Security notice ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="alert alert-warning"
        >
          <Shield size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: 5, fontSize: 13 }}>
              Gmail users — use an App Password
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 1.65, opacity: 0.85, color: "inherit" }}>
              Enable 2FA on your Google account, then generate an App Password at{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank" rel="noopener noreferrer"
                style={{ fontWeight: 600, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                myaccount.google.com/apppasswords <ExternalLink size={11} />
              </a>
              . Regular Gmail passwords will be rejected.
            </p>
          </div>
        </motion.div>

        {/* ── Saved success ──────────────────────────────────────────── */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert alert-success"
          >
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            Configuration saved! Your next email campaign will use these settings.
          </motion.div>
        )}

        {/* ── Save button ────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setConfig(defaultConfig); setSaved(false); }}
            >
              Reset defaults
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="btn btn-primary"
              style={{ minWidth: 150, justifyContent: "center" }}
            >
              {saveMutation.isPending ? (
                <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</>
              ) : (
                <><Settings2 size={14} /> Save Configuration</>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
