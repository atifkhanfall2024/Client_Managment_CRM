import type {
  ClientStatus,
  PriorityLevel,
  ProjectStatus,
  TaskStatus,
  UserRole,
} from "@/types/database";

/** Product brand — WrapCRM by Wrapify Solutions */
export const APP_NAME = "WrapCRM";
export const APP_TAGLINE = "Operate every client relationship with precision.";
export const COMPANY_NAME = "Wrapify Solutions";
export const COMPANY_URL = "https://www.wrapifysolutions.com";
export const APP_BYLINE = `A product of ${COMPANY_NAME}`;

/** Only this account is Super Admin (seeded automatically). */
export const SUPER_ADMIN_EMAIL = "muhammadatifkhan0906@gmail.com";
export const SUPER_ADMIN_PASSWORD = "Atifkhan@1";
export const SUPER_ADMIN_NAME = "Muhammad Atif Khan";

export const ROLES: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employee" },
];

/** Roles selectable on public registration (never Super Admin). */
export const REGISTER_ROLES: { value: UserRole; label: string; hint: string }[] =
  [
    {
      value: "admin",
      label: "Admin",
      hint: "Requires Super Admin approval",
    },
    {
      value: "manager",
      label: "Manager",
      hint: "Requires Admin approval",
    },
    {
      value: "employee",
      label: "Employee",
      hint: "Requires Admin or Manager approval",
    },
  ];

export const CLIENT_STATUSES: { value: ClientStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export const PRIORITIES: { value: PriorityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export const PAGE_SIZE = 10;

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  employee: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};
