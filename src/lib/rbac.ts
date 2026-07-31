import { ROLE_HIERARCHY } from "@/lib/constants";
import type { UserRole } from "@/types/database";

export type Permission =
  | "users.manage"
  | "roles.manage"
  | "clients.create"
  | "clients.update"
  | "clients.delete"
  | "clients.view"
  | "companies.manage"
  | "projects.create"
  | "projects.update"
  | "projects.view"
  | "tasks.create"
  | "tasks.assign"
  | "tasks.update"
  | "tasks.view"
  | "reports.view"
  | "settings.manage"
  | "documents.upload"
  | "documents.view"
  | "activity.view"
  | "portal.view";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "users.manage",
    "roles.manage",
    "clients.create",
    "clients.update",
    "clients.delete",
    "clients.view",
    "companies.manage",
    "projects.create",
    "projects.update",
    "projects.view",
    "tasks.create",
    "tasks.assign",
    "tasks.update",
    "tasks.view",
    "reports.view",
    "settings.manage",
    "documents.upload",
    "documents.view",
    "activity.view",
  ],
  admin: [
    "users.manage",
    "clients.create",
    "clients.update",
    "clients.delete",
    "clients.view",
    "companies.manage",
    "projects.create",
    "projects.update",
    "projects.view",
    "tasks.create",
    "tasks.assign",
    "tasks.update",
    "tasks.view",
    "reports.view",
    "documents.upload",
    "documents.view",
    "activity.view",
  ],
  manager: [
    "clients.view",
    "companies.manage",
    "projects.create",
    "projects.update",
    "projects.view",
    "tasks.create",
    "tasks.assign",
    "tasks.update",
    "tasks.view",
    "reports.view",
    "documents.upload",
    "documents.view",
    "activity.view",
  ],
  employee: [
    "clients.view",
    "projects.view",
    "tasks.update",
    "tasks.view",
    "documents.upload",
    "documents.view",
  ],
  client: ["portal.view", "projects.view", "tasks.view", "documents.view"],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasMinRole(role: UserRole, minRole: UserRole) {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

export function isStaffRole(role: UserRole) {
  return role !== "client";
}

export function homePathForRole(role: UserRole) {
  return role === "client" ? "/portal" : "/dashboard";
}

export function canAccessRoute(role: UserRole, path: string) {
  if (role === "client") {
    return path.startsWith("/portal") || path.startsWith("/api/files");
  }
  if (path.startsWith("/portal")) return false;
  if (path.startsWith("/users") || path.startsWith("/settings/roles")) {
    return hasPermission(role, "users.manage");
  }
  if (path.startsWith("/reports")) {
    return hasPermission(role, "reports.view");
  }
  if (path.startsWith("/activity")) {
    return hasPermission(role, "activity.view");
  }
  if (path.startsWith("/clients") && path.includes("/new")) {
    return hasPermission(role, "clients.create");
  }
  return true;
}
