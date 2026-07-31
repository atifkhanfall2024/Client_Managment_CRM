import { z } from "zod";

/** Empty → ""; bare domain → https://… */
function normalizeOptionalUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function emptyToNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

const optionalUrl = z.preprocess(
  normalizeOptionalUrl,
  z.union([
    z.literal(""),
    z
      .string()
      .url(
        "Enter a valid website (e.g. example.com or https://example.com)"
      ),
  ])
);

const optionalUuid = z.preprocess(
  emptyToNull,
  z.string().uuid().nullable().optional()
);

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["super_admin", "admin", "manager", "employee", "client"]).optional(),
});

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  website: optionalUrl,
  industry: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const clientSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  company_id: optionalUuid,
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: optionalUrl,
  address: z.string().optional(),
  industry: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  deadline: z.preprocess(emptyToNull, z.string().nullable().optional()),
  requirements: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["lead", "active", "inactive", "archived"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigned_manager_id: optionalUuid,
});

export const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  client_id: z.string().uuid("Select a client"),
  description: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  deadline: z.preprocess(emptyToNull, z.string().nullable().optional()),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum([
    "planning",
    "in_progress",
    "on_hold",
    "completed",
    "cancelled",
  ]),
  progress: z.coerce.number().min(0).max(100).optional(),
  manager_id: optionalUuid,
  member_ids: z.array(z.string().uuid()).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional(),
  project_id: z.string().uuid("Select a project"),
  assigned_to: optionalUuid,
  due_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "review", "done", "cancelled"]),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export const meetingSchema = z.object({
  title: z.string().min(2, "Meeting title is required"),
  agenda: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  scheduled_at: z.string().min(1, "Date & time required"),
  duration_minutes: z.coerce.number().min(15).max(480).default(30),
  location: z.string().optional().nullable(),
  meeting_url: z.string().optional().nullable(),
  manager_id: optionalUuid,
  visible_to_client: z.boolean().optional().default(true),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  avatar_url: z.string().optional().nullable(),
});

export const userManageSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["super_admin", "admin", "manager", "employee", "client"]),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type MeetingInput = z.infer<typeof meetingSchema>;
export type UserManageInput = z.infer<typeof userManageSchema>;
