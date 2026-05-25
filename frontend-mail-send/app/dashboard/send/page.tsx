"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { useTemplates } from "@/hooks/useTemplates";
import { useSendEmails, useRetryEmails, useCancelEmail } from "@/hooks/useEmail";
import { emailService } from "@/services/emailService";
import { Upload, FileText, Send, RefreshCw, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { BulkJob, SendEmailResponse } from "@/types";
import { io, Socket } from "socket.io-client";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SENT:     "badge-sent",
    FAILED:   "badge-failed",
    COOLDOWN: "badge-cooldown",
    SKIPPED:  "badge-skipped",
    PENDING:  "badge-skipped",
    PROCESSING: "badge-cooldown",
    CANCELLED: "badge-failed", // Map Cancelled badge style to red/failed
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
  const [expandedRow, setExpandedRow]           = useState<string | null>(null);
  const pdfRef                                  = useRef<HTMLInputElement>(null);

  const [activeJob, setActiveJob]               = useState<BulkJob | null>(null);
  const socketRef                               = useRef<Socket | null>(null);

  const { data: templates, isLoading: tplLoading } = useTemplates();
  const sendMutation  = useSendEmails();
  const retryMutation = useRetryEmails();
  const cancelMutation = useCancelEmail();

  // 1. Fetch latest bulk job on mount to restore state if a refresh occurred
  useEffect(() => {
    emailService.getLatestJob()
      .then((job) => {
        if (job) {
          setActiveJob(job);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Connect to Socket.IO when a job is active/processing
  const activeJobId = activeJob?._id || activeJob?.jobId;
  const activeJobStatus = activeJob?.status;

  useEffect(() => {
    if (!activeJobId || (activeJobStatus !== "PROCESSING" && activeJobStatus !== "PENDING")) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Already connected to this socket, no need to reconnect
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const newSocket = io(socketUrl);

    newSocket.on("connect", () => {
      console.log("🔌 Connected to Socket.IO backend for job:", activeJobId);
      newSocket.emit("join-job", activeJobId);
    });

    newSocket.on("job-progress", (data) => {
      console.log("⚡ Live progress update received:", data);
      setActiveJob({
        ...data,
        _id: data._id || data.jobId || activeJobId,
      });
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [activeJobId, activeJobStatus]);

  const handleSend = () => {
    if (!pdfFile) return;
    sendMutation.mutate(
      { pdf: pdfFile, templateId: selectedTemplateId || undefined },
      {
        onSuccess: (data: SendEmailResponse) => {
          // Immediately set job progress panel to pending/started state
          setActiveJob({
            _id: data.jobId,
            status: "PENDING",
            totalCount: data.summary.total,
            sentCount: 0,
            failedCount: 0,
            coolDownCount: 0,
            pendingCount: data.summary.total,
            percentage: 0,
            results: [],
          });
        },
      }
    );
  };

  return (
    <DashboardShell
      title="Send Emails"
      description="Upload a PDF of HR contacts and blast personalised emails asynchronously."
      action={
        activeJob && activeJob.status === "COMPLETED" && activeJob.failedCount > 0 ? (
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
      <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Step 1: PDF Selection */}
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: "var(--r-xl)", padding: "24px", boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span className="step-num">1</span>
            <h3 style={{ color: "var(--text-primary)", fontSize: 14 }}>Upload HR Contacts PDF</h3>
          </div>

          <input ref={pdfRef} type="file" accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />

          <div
            className={`upload-zone ${pdfFile ? "active" : ""}`}
            onClick={() => pdfRef.current?.click()}
          >
            {pdfFile ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--r-lg)",
                  background: "var(--accent-subtle)", border: "1px solid var(--border-accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FileText size={18} color="var(--text-accent)" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: 14 }}>{pdfFile.name}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>
                    {(pdfFile.size / 1024).toFixed(1)} KB · click to change
                  </p>
                </div>
                <CheckCircle2 size={18} color="#34d399" style={{ marginLeft: 8 }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--r-lg)",
                  background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-default)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Upload size={18} color="var(--text-muted)" />
                </div>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                    Drop your PDF here or click to browse
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Must contain HR contact table (name, company, email)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Email Template Selection */}
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: "var(--r-xl)", padding: "24px", boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span className="step-num">2</span>
            <h3 style={{ color: "var(--text-primary)", fontSize: 14 }}>Select Email Template</h3>
          </div>

          {tplLoading ? (
            <div className="skeleton" style={{ height: 42, width: "100%" }} />
          ) : templates && templates.length > 0 ? (
            <div style={{ position: "relative" }}>
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
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none",
              }} />
            </div>
          ) : (
            <div className="alert alert-warning">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M7.5 1L13.5 12H1.5L7.5 1Z" stroke="#fbbf24" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M7.5 6v3M7.5 11h.01" stroke="#fbbf24" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span>
                No templates found.{" "}
                <a href="/dashboard/templates" style={{ color: "#fbbf24", fontWeight: 500 }}>Create one first →</a>
              </span>
            </div>
          )}
        </div>

        {/* Trigger Send Button */}
        <button
          onClick={handleSend}
          disabled={!pdfFile || sendMutation.isPending || !!(activeJob && (activeJob.status === "PROCESSING" || activeJob.status === "PENDING"))}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 14, borderRadius: "var(--r-lg)" }}
        >
          {sendMutation.isPending ? (
            <>
              <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Queuing email campaign…
            </>
          ) : (
            <><Send size={15} /> Send Emails</>
          )}
        </button>

        {/* Real-time Job Progress Dashboard Card */}
        <AnimatePresence>
          {activeJob && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--r-xl)",
                overflow: "hidden",
                boxShadow: "var(--shadow-card)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>Active Email Campaign Progress</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Status:</span>
                    <StatusBadge status={activeJob.status} />
                    {(activeJob.status === "PROCESSING" || activeJob.status === "PENDING") && (
                      <button
                        onClick={() => cancelMutation.mutate(activeJob._id || activeJob.jobId || "latest")}
                        disabled={cancelMutation.isPending}
                        className="btn btn-secondary btn-sm"
                        style={{
                          borderColor: "rgba(239, 68, 68, 0.35)",
                          color: "#f87171",
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 6,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          height: 22,
                        }}
                      >
                        {cancelMutation.isPending ? "Stopping..." : "Stop Campaign"}
                      </button>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-accent)" }}>
                  {activeJob.percentage || 0}%
                </span>
              </div>

              {/* Progress Bar with glowing neon accents */}
              <div style={{
                width: "100%",
                height: 8,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
                overflow: "hidden",
                position: "relative",
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activeJob.percentage || 0}%` }}
                  transition={{ duration: 0.4 }}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                    boxShadow: "0 0 10px rgba(124, 58, 237, 0.4)",
                  }}
                />
              </div>

              {/* Campaign Status Counters */}
              <div className="active-job-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  { label: "Total", value: activeJob.totalCount || 0, color: "var(--text-primary)" },
                  { label: "Sent", value: activeJob.sentCount || 0, color: "#34d399" },
                  { label: "Failed", value: activeJob.failedCount || 0, color: "#f87171" },
                  { label: "Cooldown", value: activeJob.coolDownCount || 0, color: "#fbbf24" },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: "12px",
                    borderRadius: "var(--r-lg)",
                    background: "rgba(255,255,255,0.015)",
                    textAlign: "center",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 6, fontWeight: 500 }}>{s.label}</p>
                    <p style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Real-time logs grid table */}
              {activeJob.results && Array.isArray(activeJob.results) && activeJob.results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <h4 style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>Live Dispatch Logs</h4>
                  <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-lg)" }}>
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
                        {(activeJob.results || []).map((r, i) => (
                          <>
                            <tr
                              key={i}
                              style={{ cursor: r.reason ? "pointer" : "default" }}
                              onClick={() => r.reason && setExpandedRow(expandedRow === r.email ? null : r.email)}
                            >
                              <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{r.name || "—"}</td>
                              <td>{r.company || "—"}</td>
                              <td className="mono" style={{ fontSize: 12 }}>{r.email}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                                  background: "rgba(255,255,255,0.01)",
                                  color: "var(--text-muted)", fontSize: 12, fontStyle: "italic", paddingTop: 6, paddingBottom: 10,
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
                </div>
              )}

              {/* Finalized Report Saved Card */}
              {activeJob.finalReport && (
                <div style={{
                  padding: "16px",
                  background: "linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.03) 100%)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  borderRadius: "var(--r-lg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 20px rgba(52,211,153,0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <div>
                      <p style={{ color: "#34d399", fontSize: 13, fontWeight: 600 }}>Campaign Completed Successfully!</p>
                      <p style={{ color: "var(--text-muted)", fontSize: 11.5, marginTop: 2 }}>
                        Final report: <span className="mono" style={{ color: "var(--text-secondary)" }}>{activeJob.finalReport}</span>
                      </p>
                    </div>
                  </div>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/uploads/${activeJob.finalReport}`}
                    download
                    className="btn btn-secondary btn-sm"
                    style={{ color: "#34d399", borderColor: "rgba(52,211,153,0.3)", padding: "7px 12px" }}
                  >
                    Download Report
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
