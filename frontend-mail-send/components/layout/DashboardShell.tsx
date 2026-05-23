"use client";
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";

interface DashboardShellProps {
  children: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function DashboardShell({ children, title, description, action }: DashboardShellProps) {
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg-base)" }}>
      <Sidebar />

      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"auto" }}>
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
          {action && <div>{action}</div>}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35, delay:0.05 }}
          style={{ flex:1, padding:"28px 32px", maxWidth:1100 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
