"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";
import { hasPermission } from "@/lib/rbac";
import { connectMongo } from "@/lib/mongodb";
import { ClientModel, ProjectModel, newId, toIso } from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import { projectSchema } from "@/lib/validations";
import type { ActionResult } from "@/core/types/result";
import type { PriorityLevel, ProjectStatus } from "@/types/database";
import { PAGE_SIZE } from "@/lib/constants";

async function attachProject(project: Record<string, unknown>) {
  const [client, manager, members] = await Promise.all([
    ClientModel.findOne({ id: project.client_id }).lean(),
    project.manager_id
      ? UserModel.findOne({ id: project.manager_id }).lean()
      : null,
    UserModel.find({
      id: { $in: (project.member_ids as string[]) ?? [] },
    }).lean(),
  ]);

  return {
    id: String(project.id),
    name: String(project.name),
    client_id: String(project.client_id),
    description: (project.description as string | null) ?? null,
    budget: Number(project.budget ?? 0),
    deadline: (project.deadline as string | null) ?? null,
    priority: project.priority as PriorityLevel,
    status: project.status as ProjectStatus,
    progress: Number(project.progress ?? 0),
    manager_id: (project.manager_id as string | null) ?? null,
    member_ids: (project.member_ids as string[]) ?? [],
    created_by: (project.created_by as string | null) ?? null,
    created_at: toIso(project.created_at as Date) ?? new Date().toISOString(),
    updated_at: toIso(project.updated_at as Date) ?? new Date().toISOString(),
    deleted_at: toIso(project.deleted_at as Date | null),
    client: client ? { id: String(client.id), name: String(client.name) } : null,
    manager: manager
      ? { id: String(manager.id), full_name: String(manager.full_name) }
      : null,
    members: members.map((m) => ({
      id: `${project.id}-${m.id}`,
      project_id: String(project.id),
      user_id: String(m.id),
      profile: {
        id: String(m.id),
        full_name: String(m.full_name),
        email: String(m.email),
      },
    })),
  };
}

export async function getProjects(params?: {
  page?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
}) {
  const { requireStaffProfile } = await import("@/lib/auth/require-staff");
  await requireStaffProfile();
  await connectMongo();
  const page = params?.page ?? 1;
  const filter: Record<string, unknown> = { deleted_at: null };
  if (params?.search) {
    filter.name = { $regex: params.search, $options: "i" };
  }
  if (params?.status) filter.status = params.status;

  const sortField = params?.sort || "created_at";
  const sortDir = params?.order === "asc" ? 1 : -1;
  const count = await ProjectModel.countDocuments(filter);
  const rows = await ProjectModel.find(filter)
    .sort({ [sortField]: sortDir })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const data = await Promise.all(
    rows.map((r) => attachProject(r as Record<string, unknown>))
  );

  return {
    data,
    count,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)),
  };
}

export async function getProject(id: string): Promise<{
  id: string;
  name: string;
  client_id: string;
  description: string | null;
  budget: number | null;
  deadline: string | null;
  priority: PriorityLevel;
  status: ProjectStatus;
  progress: number;
  manager_id: string | null;
  member_ids: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  client: { id: string; name: string } | null;
  manager: { id: string; full_name: string } | null;
  members: { id: string; project_id: string; user_id: string; profile: { id: string; full_name: string; email: string } }[];
}> {
  const { requireStaffProfile } = await import("@/lib/auth/require-staff");
  await requireStaffProfile();
  await connectMongo();
  const project = await ProjectModel.findOne({ id, deleted_at: null }).lean();
  if (!project) throw new Error("Project not found");
  return attachProject(project as Record<string, unknown>);
}

export async function createProjectAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "projects.create")) {
    return { success: false, error: "Permission denied" };
  }

  const memberIds = formData.getAll("member_ids").filter(Boolean) as string[];
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    client_id: formData.get("client_id"),
    description: formData.get("description") || "",
    budget: formData.get("budget") || 0,
    deadline: formData.get("deadline") || null,
    priority: formData.get("priority") || "medium",
    status: formData.get("status") || "planning",
    progress: formData.get("progress") || 0,
    manager_id: formData.get("manager_id") || profile.id,
    member_ids: memberIds,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  const id = newId();
  const { member_ids, ...projectData } = parsed.data;

  await ProjectModel.create({
    id,
    ...projectData,
    manager_id: projectData.manager_id || profile.id,
    deadline: projectData.deadline || null,
    member_ids: member_ids ?? [],
    created_by: profile.id,
  });

  for (const userId of member_ids ?? []) {
    await createNotification({
      user_id: userId,
      title: "Added to project",
      message: `You were assigned to project ${projectData.name}`,
      link: `/projects/${id}`,
    });
  }

  await logActivity({
    action: "created",
    entity_type: "project",
    entity_id: id,
    metadata: { name: projectData.name },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, data: { id } };
}

export async function updateProjectAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "projects.update")) {
    return { success: false, error: "Permission denied" };
  }

  const memberIds = formData.getAll("member_ids").filter(Boolean) as string[];
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    client_id: formData.get("client_id"),
    description: formData.get("description") || "",
    budget: formData.get("budget") || 0,
    deadline: formData.get("deadline") || null,
    priority: formData.get("priority") || "medium",
    status: formData.get("status") || "planning",
    progress: formData.get("progress") || 0,
    manager_id: formData.get("manager_id") || null,
    member_ids: memberIds,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  const { member_ids, ...projectData } = parsed.data;
  const updated = await ProjectModel.findOneAndUpdate(
    { id, deleted_at: null },
    {
      ...projectData,
      deadline: projectData.deadline || null,
      manager_id: projectData.manager_id || null,
      member_ids: member_ids ?? [],
    },
    { new: true }
  ).lean();

  if (!updated) return { success: false, error: "Project not found" };

  await logActivity({
    action: "updated",
    entity_type: "project",
    entity_id: id,
    metadata: { name: updated.name, status: updated.status },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  return { success: true, data: { id } };
}

export async function softDeleteProjectAction(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "projects.update")) {
    return { success: false, error: "Permission denied" };
  }

  await connectMongo();
  await ProjectModel.updateOne({ id }, { deleted_at: new Date() });
  await logActivity({
    action: "soft_deleted",
    entity_type: "project",
    entity_id: id,
  });
  revalidatePath("/projects");
  return { success: true };
}
