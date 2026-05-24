"use client";
import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import { Mail, Menu } from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function DashboardShell({ children, title, description, action }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg-base)" }}>
      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="sidebar-backdrop"
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"auto" }}>
        {/* Sticky Mobile Header Bar */}
        <header className="mobile-header">
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background:"none", border:"none", cursor:"pointer",
              color:"var(--text-primary)", display:"flex", alignItems:"center",
              justifyContent:"center", padding:6, borderRadius:"var(--r-md)",
            }}
          >
            <Menu size={18} />
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:24, height:24, borderRadius:6,
              background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Mail size={11} color="#fff" />
            </div>
            <span style={{ color:"var(--text-primary)", fontWeight:600, fontSize:13.5, letterSpacing:"-0.02em" }}>
              MailFlow
            </span>
          </div>
          <div style={{ width:30 }} /> {/* Horizontal spacing balance */}
        </header>

        {/* Page header */}
        <div className="page-header">
          <div>
            <motion.h1
              initial={{ opacity:0, x:-6 }}
              animate={{ opacity:1, x:0 }}
              transition={{ duration:0.3 }}
            >
              {title}
            </motion.h1>
            {description && (
              <p style={{ color:"var(--text-muted)", fontSize:13, marginTop:3, fontWeight:400 }}>
                {description}
              </p>
            )}
          </div>
          {action && <div style={{ display:"flex", gap:8, flexShrink:0 }}>{action}</div>}
        </div>

        {/* Responsive Content Page Wrapper */}
        <motion.div
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35, delay:0.05 }}
          className="main-content"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
