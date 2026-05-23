import type { Metadata } from "next";
import AuthGuard from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | MailFlow",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
