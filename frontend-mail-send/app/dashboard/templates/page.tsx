"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { useTemplates, useUploadTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useTemplates";
import { Plus, FileText, Upload, X, ChevronDown, ChevronUp, Tag, Calendar, Edit3, Trash2 } from "lucide-react";
import { Template } from "@/types";

function TemplateCard({ template, expanded, onToggle, onEdit, onDelete }: { template: Template; expanded: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{
      background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
      borderRadius:"var(--r-xl)", overflow:"hidden", boxShadow:"var(--shadow-card)",
      transition:"var(--t-smooth)",
    }}>
      <div style={{ padding:"18px 20px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:36, height:36, borderRadius:"var(--r-md)", flexShrink:0,
              background:"var(--accent-subtle)", border:"1px solid var(--border-accent)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <FileText size={15} color="var(--text-accent)" />
            </div>
            <div>
              <p style={{ color:"var(--text-primary)", fontWeight:600, fontSize:14 }}>{template.name}</p>
              {template.fileName && (
                <p className="mono" style={{ color:"var(--text-muted)", fontSize:11, marginTop:2 }}>{template.fileName}</p>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={onEdit} style={{
              background:"none", border:"none", cursor:"pointer",
              color:"var(--text-muted)", padding:6, display:"flex", alignItems:"center",
              borderRadius:6, transition:"all 0.12s",
            }} aria-label="Edit template">
              <Edit3 size={15} />
            </button>
            <button onClick={onDelete} style={{
              background:"none", border:"none", cursor:"pointer",
              color:"var(--text-danger, #ef4444)", padding:6, display:"flex", alignItems:"center",
              borderRadius:6, transition:"all 0.12s",
            }} aria-label="Delete template">
              <Trash2 size={15} />
            </button>
            <button onClick={onToggle} style={{
              background:"none", border:"none", cursor:"pointer",
              color:"var(--text-muted)", padding:4, display:"flex", alignItems:"center",
              borderRadius:6, transition:"all 0.12s",
            }}>
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {template.subjects.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
            {template.subjects.slice(0, 3).map((s, i) => (
              <span key={i} style={{
                display:"inline-flex", alignItems:"center", gap:4,
                padding:"3px 8px", borderRadius:"var(--r-full)",
                background:"rgba(255,255,255,0.04)", border:"1px solid var(--border-subtle)",
                color:"var(--text-muted)", fontSize:11.5,
              }}>
                <Tag size={9} /> {s.length > 45 ? s.slice(0,45) + "…" : s}
              </span>
            ))}
            {template.subjects.length > 3 && (
              <span style={{ color:"var(--text-muted)", fontSize:11.5, alignSelf:"center" }}>
                +{template.subjects.length - 3} more
              </span>
            )}
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:6, color:"var(--text-muted)", fontSize:11.5 }}>
          <Calendar size={11} />
          {new Date(template.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }}
            style={{ overflow:"hidden" }}
          >
            <div style={{
              padding:"16px 20px", borderTop:"1px solid var(--border-subtle)",
              background:"rgba(255,255,255,0.01)",
            }}>
              <p style={{ color:"var(--text-muted)", fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>
                Content preview
              </p>
              <pre className="mono" style={{
                color:"var(--text-secondary)", fontSize:12, lineHeight:1.6,
                background:"rgba(255,255,255,0.02)", borderRadius:"var(--r-md)",
                padding:14, overflow:"auto", border:"1px solid var(--border-subtle)",
                maxHeight:180, whiteSpace:"pre-wrap",
              }}>
                {template.content}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TemplatesPage() {
  const { data: templates, isLoading, refetch } = useTemplates();
  const uploadMutation = useUploadTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [showForm, setShowForm] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [name, setName]         = useState("");
  const [subjects, setSubjects] = useState("");
  const [content, setContent]   = useState("");
  const [file, setFile]         = useState<File | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(editingTemplateId);

  const resetForm = () => {
    setEditingTemplateId(null);
    setName("");
    setSubjects("");
    setContent("");
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, content: content || undefined, subjects: subjects || undefined, file: file || undefined };

    if (isEditing && editingTemplateId) {
      await updateMutation.mutateAsync({ id: editingTemplateId, payload });
    } else {
      await uploadMutation.mutateAsync(payload);
    }

    resetForm();
    setShowForm(false);
    refetch();
  };

  const handleDelete = async (templateId: string) => {
    const confirmed = window.confirm("Delete this template permanently?");
    if (!confirmed) return;
    await deleteMutation.mutateAsync(templateId);
    if (editingTemplateId === templateId) {
      resetForm();
      setShowForm(false);
    }
    refetch();
  };

  const startEditing = (template: Template) => {
    setShowForm(true);
    setEditingTemplateId(template._id);
    setName(template.name);
    setSubjects(template.subjects.join(", "));
    setContent(template.content);
    setFile(null);
  };

  return (
    <DashboardShell
      title="Templates"
      description="Manage email templates with Handlebars personalisation."
      action={
        <button
          onClick={() => {
            if (showForm && editingTemplateId) {
              resetForm();
            }
            setShowForm(!showForm);
          }}
          className={`btn ${showForm ? "btn-secondary" : "btn-primary"} btn-sm`}
        >
          {showForm ? <><X size={13}/> Cancel</> : <><Plus size={13}/> New Template</>}
        </button>
      }
    >
      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity:0, height:0 }}
            animate={{ opacity:1, height:"auto" }}
            exit={{ opacity:0, height:0 }}
            style={{ marginBottom:24, overflow:"hidden" }}
          >
            <form onSubmit={handleSubmit} style={{
              background:"var(--bg-surface)", border:"1px solid var(--border-accent)",
              borderRadius:"var(--r-xl)", padding:"24px",
              boxShadow:"0 0 0 1px rgba(124,58,237,0.1), var(--shadow-card)",
            }}>
              <p style={{ color:"var(--text-primary)", fontWeight:600, fontSize:14, marginBottom:18 }}>
                {isEditing ? "Edit Template" : "Create / Update Template"}
              </p>

              <div className="form-grid" style={{ marginBottom:16 }}>
                <div>
                  <label style={{ display:"block", fontSize:12.5, fontWeight:500, color:"var(--text-secondary)", marginBottom:7 }}>
                    Template name *
                  </label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Software Engineer Outreach" required />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12.5, fontWeight:500, color:"var(--text-secondary)", marginBottom:7 }}>
                    Email subjects *
                  </label>
                  <input value={subjects} onChange={(e) => setSubjects(e.target.value)}
                    placeholder="Job at {{company}}, Opportunity at {{company}}" required />
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12.5, fontWeight:500, color:"var(--text-secondary)", marginBottom:7 }}>
                  HTML content *
                </label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Dear {{name}}, I am reaching out regarding {{company}}…</p>"
                  rows={6} className="mono"
                  style={{ resize:"vertical" }}
                  required={!file}
                />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:12.5, fontWeight:500, color:"var(--text-secondary)", marginBottom:7 }}>
                  Or upload HTML file
                </label>
                <input ref={fileRef} type="file" accept=".html,.htm,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                >
                  <Upload size={13} />
                  {file ? file.name : "Choose file…"}
                </button>
              </div>

              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button type="submit" disabled={(uploadMutation.isPending || updateMutation.isPending) || !name || !subjects || (!content && !file)} className="btn btn-primary btn-sm">
                  {(uploadMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <span style={{ width:12, height:12, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                      Saving…
                    </>
                  ) : isEditing ? "Update Template" : "Save Template"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template list */}
      {isLoading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:14 }}>
          {Array.from({length:4}).map((_, i) => (
            <div key={i} style={{
              background:"var(--bg-surface)", border:"1px solid var(--border-subtle)",
              borderRadius:"var(--r-xl)", padding:"20px", display:"flex", flexDirection:"column", gap:14,
            }}>
              <div style={{ display:"flex", gap:12 }}>
                <div className="skeleton" style={{ width:36, height:36, borderRadius:"var(--r-md)", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div className="skeleton" style={{ width:"60%", height:14, marginBottom:8 }} />
                  <div className="skeleton" style={{ width:"35%", height:11 }} />
                </div>
              </div>
              <div className="skeleton" style={{ width:"40%", height:11 }} />
            </div>
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:14 }}>
          {templates.map((t) => (
            <TemplateCard key={t._id} template={t}
              expanded={expandedId === t._id}
              onToggle={() => setExpandedId(expandedId === t._id ? null : t._id)}
              onEdit={() => startEditing(t)}
              onDelete={() => handleDelete(t._id)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"80px 24px", textAlign:"center",
        }}>
          <div style={{
            width:52, height:52, borderRadius:"var(--r-xl)", marginBottom:18,
            background:"rgba(255,255,255,0.03)", border:"1px solid var(--border-default)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <FileText size={22} color="var(--text-muted)" />
          </div>
          <h3 style={{ color:"var(--text-primary)", marginBottom:8, fontSize:16 }}>No templates yet</h3>
          <p style={{ color:"var(--text-muted)", fontSize:13.5, marginBottom:20 }}>
            Create your first template to start sending personalised emails.
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <Plus size={13} /> Create Template
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
