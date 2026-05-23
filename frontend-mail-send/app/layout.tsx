import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MailFlow — Bulk Job Application Email Sender",
    template: "%s | MailFlow",
  },
  description:
    "Automate your job hunt. Upload a PDF of HR contacts, pick a template, and blast personalized emails in seconds.",
  keywords: ["email sender", "bulk email", "job application", "HR outreach", "automation"],
  openGraph: {
    title: "MailFlow — Bulk Job Application Email Sender",
    description: "Automate your HR outreach with intelligent bulk emailing.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
