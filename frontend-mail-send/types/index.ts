// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  name: string;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  message: string;
  name: string;
  /** Short-lived access token (15m) */
  accessToken: string;
  /** Long-lived refresh token (7d) */
  refreshToken: string;
  /** Legacy alias for accessToken — kept for backward compat */
  token: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  name: string;
}

// ─── Template ─────────────────────────────────────────────────────────────────
export interface Template {
  _id: string;
  name: string;
  content: string;
  subjects: string[];
  fileName?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadTemplatePayload {
  name: string;
  content?: string;
  subjects?: string; // comma-separated
  template?: File;   // optional file upload
}

export interface TemplatesResponse {
  success: boolean;
  templates: Template[];
}

export interface UploadTemplateResponse {
  success: boolean;
  message: string;
  template: Template;
}

export interface DeleteTemplateResponse {
  success: boolean;
  message: string;
}

// ─── Email ────────────────────────────────────────────────────────────────────
export interface SendEmailPayload {
  pdf: File;
  templateId?: string;
  templateName?: string;
}

export interface EmailResult {
  email: string;
  status: "SENT" | "FAILED" | "COOLDOWN" | "SKIPPED";
  reason?: string;
  company?: string;
  name?: string;
}

export interface SendEmailResponse {
  success: boolean;
  fileCreated: string;
  summary: {
    total: number;
    sent: number;
    failedCount: number;
    coolDownCount: number;
  };
  failedEmails: { email: string; reason: string }[];
  results: EmailResult[];
  finalReport: string;
}

// ─── Email Config ─────────────────────────────────────────────────────────────
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
}

export interface EmailConfigResponse {
  message: string;
  config: EmailConfig & { _id: string; userId: string; createdAt: string };
  status: number;
}

// ─── Analytics / Stats ────────────────────────────────────────────────────────
export interface DayStatEntry {
  status: "SENT" | "FAILED" | "COOLDOWN" | "SKIPPED";
  count: number;
}

export interface DailyStat {
  _id: string; // "YYYY-MM-DD"
  counts: DayStatEntry[];
}

// ─── Resume ───────────────────────────────────────────────────────────────────
export interface ResumeUploadResponse {
  success: boolean;
  message: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  errorMessage?: string;
  statusCode?: number;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
export type EmailStatus = "SENT" | "FAILED" | "COOLDOWN" | "SKIPPED";
