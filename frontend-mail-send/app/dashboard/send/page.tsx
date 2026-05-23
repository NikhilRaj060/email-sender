"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { useTemplates } from "@/hooks/useTemplates";
import { useSendEmails, useRetryEmails } from "@/hooks/useEmail";
import { Upload, FileText, Send, RefreshCw, CheckCircle2, FileUp, ChevronDown, ChevronUp } from "lucide-react";
import { EmailResult } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SENT:     "badge-sent",
    FAILED:   "badge-failed",
    COOLDOWN: "badge-cooldown",
    SKIPPED:  "badge-skipped",
  };
  return (
    <span className={`badge badge-dot ${map[status] || "badge-skipped"}`}>
      {status}
    </span>
  );
}

export default function SendPage() {
  const [pdfFile, setPdfFile]                   = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showResults, setShowResults]           = useState(false);
  const [expandedRow, setExpandedRow]           = useState<string | null>(null);
  const pdfRef                                  = useRef<HTMLInputElement>(null);

  const { data: templates, isLoading: tplLoading } = useTemplates();
  const sendMutation  = useSendEmails();
  const retryMutation = useRetryEmails();
  const result        = sendMutation.data;

  const handleSend = () => {
    if (!pdfFile) return;
    sendMutation.mutate(
      { pdf:pdfFile, templateId:selectedTemplateId || undefined },
      { onSuccess: () => setShowResults(true) }
    );
  };

  return (
    <DashboardShell
      title="Send Emails"
      description="Upload a PDF of HR contacts and blast personalised emails."
      action={
        result ? (
          <button
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={13} style={{ animation: retryMutation.isPending ? "spin 0.8s linear infinite" : "none" }} />
            Retry Failed
          </button>
        ) : undefined
      }
    >
      <div style={{ maxWidth:680, display:"flex", flexDirection:"column", gap:20 }}>

        {/* Step 1: PDF */}
        <div style={{
          background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
          borderRadius:"var(--r-xl)", padding:"24px", boxShadow:"var(--shadow-card)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <span className="step-num">1</span>
            <h3 style={{ color:"var(--text-primary)", fontSize:14 }}>Upload HR Contacts PDF</h3>
          </div>

          <input ref={pdfRef} type="file" accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />

          <div
            className={`upload-zone ${pdfFile ? "active" : ""}`}
            onClick={() => pdfRef.current?.click()}
          >
            {pdfFile ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14 }}>
                <div style={{
                  width:40, height:40, borderRadius:"var(--r-lg)",
                  background:"var(--accent-subtle)", border:"1px solid var(--border-accent)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <FileText size={18} color="var(--text-accent)" />
                </div>
                <div style={{ textAlign:"left" }}>
                  <p style={{ color:"var(--text-primary)", fontWeight:500, fontSize:14 }}>{pdfFile.name}</p>
                  <p style={{ color:"var(--text-muted)", fontSize:12, marginTop:2 }}>
                    {(pdfFile.size / 1024).toFixed(1)} KB · click to change
                  </p>
                </div>
                <CheckCircle2 size={18} color="#34d399" style={{ marginLeft:8 }} />
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{
                  width:44, height:44, borderRadius:"var(--r-lg)",
                  background:"rgba(255,255,255,0.04)", border:"1px solid var(--border-default)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <Upload size={18} color="var(--text-muted)" />
                </div>
                <div>
                  <p style={{ color:"var(--text-secondary)", fontWeight:500, fontSize:14, marginBottom:4 }}>
                    Drop your PDF here or click to browse
                  </p>
                  <p style={{ color:"var(--text-muted)", fontSize:12 }}>
                    Must contain HR contact table (name, company, email)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Template */}
        <div style={{
          background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
          borderRadius:"var(--r-xl)", padding:"24px", boxShadow:"var(--shadow-card)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <span className="step-num">2</span>
            <h3 style={{ color:"var(--text-primary)", fontSize:14 }}>Select Email Template</h3>
          </div>

          {tplLoading ? (
            <div className="skeleton" style={{ height:42, width:"100%" }} />
          ) : templates && templates.length > 0 ? (
            <div style={{ position:"relative" }}>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="">Auto-select first template</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}{t.subjects.length > 0 ? ` · ${t.subjects.length} subject(s)` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} color="var(--text-muted)" style={{
                position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none",
              }} />
            </div>
          ) : (
            <div className="alert alert-warning">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink:0, marginTop:1 }}>
                <path d="M7.5 1L13.5 12H1.5L7.5 1Z" stroke="#fbbf24" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M7.5 6v3M7.5 11h.01" stroke="#fbbf24" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span>
                No templates found.{" "}
                <a href="/dashboard/templates" style={{ color:"#fbbf24", fontWeight:500 }}>Create one first →</a>
              </span>
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!pdfFile || sendMutation.isPending}
          className="btn btn-primary"
          style={{ width:"100%", justifyContent:"center", padding:"13px", fontSize:14, borderRadius:"var(--r-lg)" }}
        >
          {sendMutation.isPending ? (
            <>
              <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
              Sending emails…
            </>
          ) : (
            <><Send size={15} /> Send Emails</>
          )}
        </button>

        {/* Results */}
        <AnimatePresence>
          {showResults && result && (
            <motion.div
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              style={{
                background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
                borderRadius:"var(--r-xl)", overflow:"hidden", boxShadow:"var(--shadow-card)",
              }}
            >
              {/* Summary */}
              <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border-subtle)" }}>
                <p style={{ color:"var(--text-primary)", fontWeight:600, fontSize:14, marginBottom:16 }}>
                  Send Results
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                  {[
                    { l:"Total",    v:result.summary.total,         c:"var(--text-primary)" },
                    { l:"Sent",     v:result.summary.sent,          c:"#34d399" },
                    { l:"Failed",   v:result.summary.failedCount,   c:"#f87171" },
                    { l:"Cooldown", v:result.summary.coolDownCount, c:"#fbbf24" },
                  ].map((s) => (
                    <div key={s.l} style={{
                      padding:"12px", borderRadius:"var(--r-lg)",
                      background:"rgba(255,255,255,0.025)", textAlign:"center",
                      border:"1px solid var(--border-subtle)",
                    }}>
                      <p style={{ color:"var(--text-muted)", fontSize:11, marginBottom:6, fontWeight:500 }}>{s.l}</p>
                      <p style={{ color:s.c, fontSize:22, fontWeight:700, letterSpacing:"-0.03em" }}>{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div style={{ maxHeight:340, overflowY:"auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r: EmailResult, i: number) => (
                      <>
                        <tr
                          key={i}
                          style={{ cursor: r.reason ? "pointer" : "default" }}
                          onClick={() => r.reason && setExpandedRow(expandedRow === r.email ? null : r.email)}
                        >
                          <td style={{ color:"var(--text-primary)", fontWeight:500 }}>{r.name || "—"}</td>
                          <td>{r.company || "—"}</td>
                          <td className="mono" style={{ fontSize:12.5 }}>{r.email}</td>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <StatusBadge status={r.status} />
                              {r.reason && (expandedRow === r.email
                                ? <ChevronUp size={13} color="var(--text-muted)" />
                                : <ChevronDown size={13} color="var(--text-muted)" />
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedRow === r.email && r.reason && (
                          <tr key={`${i}-reason`}>
                            <td colSpan={4} style={{
                              background:"rgba(255,255,255,0.01)",
                              color:"var(--text-muted)", fontSize:12, fontStyle:"italic", paddingTop:6, paddingBottom:10,
                            }}>
                              {r.reason}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.finalReport && (
                <div style={{
                  padding:"14px 24px", borderTop:"1px solid var(--border-subtle)",
                  display:"flex", alignItems:"center", gap:8,
                  background:"rgba(255,255,255,0.01)",
                }}>
                  <FileUp size={13} color="var(--text-muted)" />
                  <span style={{ color:"var(--text-muted)", fontSize:12 }}>
                    Report saved: <span className="mono" style={{ color:"var(--text-secondary)" }}>{result.finalReport}</span>
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
