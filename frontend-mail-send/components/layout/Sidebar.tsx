"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Send, FileText, BarChart3,
  Settings, LogOut, Mail, FileUp, X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { toast } from "sonner";

const navItems = [
  { href:"/dashboard",           label:"Dashboard",   icon:LayoutDashboard },
  { href:"/dashboard/send",      label:"Send Emails",  icon:Send },
  { href:"/dashboard/templates", label:"Templates",    icon:FileText },
  { href:"/dashboard/resume",    label:"Resume",       icon:FileUp },
  { href:"/dashboard/analytics", label:"Analytics",    icon:BarChart3 },
  { href:"/dashboard/settings",  label:"Settings",     icon:Settings },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface SidebarProps {
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { userName, logout } = useAuthStore();

  const handleLogout = async () => {
    try { 
      await authService.logout(); 
    } finally {
      logout();
      toast.success("Logged out");
      router.replace("/login");
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Logo & Close Button */}
      <div style={{
        padding:"18px 20px",
        borderBottom:"1px solid var(--border-subtle)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        width: "100%",
        flexShrink: 0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:28, height:28, borderRadius:7,
            background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 3px 10px rgba(124,58,237,0.35)",
            flexShrink:0,
          }}>
            <Mail size={13} color="#fff" />
          </div>
          <span style={{ color:"var(--text-primary)", fontWeight:600, fontSize:14.5, letterSpacing:"-0.02em" }}>
            MailFlow
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              background:"none", border:"none", cursor:"pointer",
              color:"var(--text-muted)", padding:4,
              alignItems:"center", justifyContent:"center", borderRadius:6,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding:"10px 10px", display:"flex", flexDirection:"column", gap:2 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const exact  = item.href === "/dashboard";
          const active = exact ? pathname === "/dashboard" : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:"none" }} onClick={onClose}>
              <motion.div
                whileHover={{ x: 1 }}
                style={{
                  display:"flex", alignItems:"center", gap:9,
                  padding:"8px 11px", borderRadius:"var(--r-md)",
                  fontSize:13.5, fontWeight:active ? 500 : 400,
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  transition:"all 0.14s ease",
                  cursor:"pointer",
                  position:"relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }
                }}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    style={{
                      position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
                      width:3, height:16, borderRadius:2,
                      background:"var(--accent)",
                    }}
                  />
                )}
                <Icon
                  size={15}
                  color={active ? "var(--text-accent)" : "currentColor"}
                  style={{ flexShrink:0 }}
                />
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div style={{ padding:"10px", borderTop:"1px solid var(--border-subtle)", flexShrink: 0 }}>
        <div style={{
          display:"flex", alignItems:"center", gap:9,
          padding:"9px 11px", borderRadius:"var(--r-md)",
          background:"rgba(255,255,255,0.025)", marginBottom:4,
        }}>
          <div style={{
            width:28, height:28, borderRadius:"50%", flexShrink:0,
            background:"linear-gradient(135deg, #7c3aed, #5b21b6)",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", fontSize:11, fontWeight:700,
          }}>
            {userName ? getInitials(userName) : "?"}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ color:"var(--text-primary)", fontSize:12.5, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {userName || "User"}
            </p>
            <p style={{ color:"var(--text-muted)", fontSize:11 }}>Free plan</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width:"100%", display:"flex", alignItems:"center", gap:9,
            padding:"8px 11px", borderRadius:"var(--r-md)",
            background:"transparent", border:"none", cursor:"pointer",
            color:"var(--text-muted)", fontSize:13.5, fontWeight:400,
            transition:"all 0.14s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)";
            (e.currentTarget as HTMLElement).style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          <LogOut size={14} style={{ flexShrink:0 }} />
          Log out
        </button>
      </div>
    </aside>
  );
}
