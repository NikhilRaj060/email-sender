"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { useUploadResume } from "@/hooks/useResume";
import { Upload, FileText, CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function ResumePage() {
  const [file, setFile]       = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const fileRef               = useRef<HTMLInputElement>(null);
  const uploadMutation        = useUploadResume();

  const handleUpload = async () => {
    if (!file) return;
    try {
      await uploadMutation.mutateAsync(file);
      setUploaded(true);
    } catch { /* toast shown in hook */ }
  };

  return (
    <DashboardShell
      title="Resume"
      description="Your CV is auto-attached to every job application email."
    >
      <div style={{ maxWidth:560, display:"flex", flexDirection:"column", gap:18 }}>

        {/* Required banner */}
        <div className="alert alert-info">
          <Info size={15} style={{ flexShrink:0, marginTop:1 }} />
          <div>
            <p style={{ fontWeight:600, marginBottom:4, fontSize:13 }}>Required before sending</p>
            <p style={{ fontSize:12.5, lineHeight:1.6, opacity:0.8, color:"inherit" }}>
              Upload a PDF resume first. It will be auto-attached as an attachment to every outreach email you send.
            </p>
          </div>
        </div>

        {/* Upload card */}
        <div style={{
          background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
          borderRadius:"var(--r-xl)", padding:"24px", boxShadow:"var(--shadow-card)",
        }}>
          <h3 style={{ color:"var(--text-primary)", fontSize:14, marginBottom:18 }}>Upload your CV / Resume</h3>

          <input ref={fileRef} type="file" accept=".pdf"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setUploaded(false); }}
          />

          <div
            className={`upload-zone ${file ? "active" : ""}`}
            onClick={() => fileRef.current?.click()}
            style={{ marginBottom:16 }}
          >
            {file ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{
                  width:48, height:48, borderRadius:"var(--r-lg)",
                  background:"var(--accent-subtle)", border:"1px solid var(--border-accent)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <FileText size={20} color="var(--text-accent)" />
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ color:"var(--text-primary)", fontWeight:600, fontSize:14 }}>{file.name}</p>
                  <p style={{ color:"var(--text-muted)", fontSize:12, marginTop:3 }}>
                    {(file.size / 1024).toFixed(1)} KB · PDF · click to change
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{
                  width:48, height:48, borderRadius:"var(--r-lg)",
                  background:"rgba(255,255,255,0.04)", border:"1px solid var(--border-default)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <Upload size={20} color="var(--text-muted)" />
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ color:"var(--text-secondary)", fontWeight:500, fontSize:14, marginBottom:4 }}>
                    Click to upload your resume (PDF)
                  </p>
                  <p style={{ color:"var(--text-muted)", fontSize:12 }}>Max 10 MB</p>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {uploaded && (
              <motion.div
                initial={{ opacity:0, height:0 }}
                animate={{ opacity:1, height:"auto" }}
                exit={{ opacity:0, height:0 }}
                className="alert alert-success"
                style={{ marginBottom:16, fontSize:13 }}
              >
                <CheckCircle2 size={15} style={{ flexShrink:0 }} />
                Resume uploaded successfully! It will be attached to your next campaign.
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending || uploaded}
            className="btn btn-primary"
            style={{ width:"100%", justifyContent:"center", padding:"11px" }}
          >
            {uploadMutation.isPending ? (
              <>
                <span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                Uploading…
              </>
            ) : uploaded ? (
              <><CheckCircle2 size={15}/> Uploaded</>
            ) : (
              <><Upload size={15}/> Upload Resume</>
            )}
          </button>
        </div>

        {/* Tips */}
        <div style={{
          background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
          borderRadius:"var(--r-xl)", padding:"20px 24px", boxShadow:"var(--shadow-card)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <AlertCircle size={14} color="var(--text-muted)" />
            <h3 style={{ color:"var(--text-primary)", fontSize:13, fontWeight:600 }}>Tips for better deliverability</h3>
          </div>
          <ul style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              "Use PDF format — it renders consistently across email clients.",
              "Keep file size under 2 MB to avoid spam filters.",
              "Re-upload any time to update — only the latest version is sent.",
              "Name your file clearly (e.g. Nikhil_Raj_Resume_2026.pdf).",
            ].map((tip) => (
              <li key={tip} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{
                  width:5, height:5, borderRadius:"50%", background:"var(--accent)",
                  flexShrink:0, marginTop:7,
                }} />
                <span style={{ color:"var(--text-secondary)", fontSize:13, lineHeight:1.6 }}>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
