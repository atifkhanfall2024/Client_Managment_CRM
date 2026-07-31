"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";
import { hasPermission } from "@/lib/rbac";
import { connectMongo } from "@/lib/mongodb";
import {
  ProjectModel,
  TaskCommentModel,
  TaskModel,
  newId,
  toIso,
} from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import { commentSchema, taskSchema } from "@/lib/validations";
import type { ActionResult } from "@/core/types/result";
import type { PriorityLevel, TaskStatus } from "@/types/database";
import { PAGE_SIZE } from "@/lib/constants";

async function attachTask(task: Record<string, unknown>) {
  const [project, assignee, comments] = await Promise.all([
    ProjectModel.findOne({ id: task.project_id }).lean(),
    task.assigned_to
      ? UserModel.findOne({ id: task.assigned_to }).lean()
      : null,
    TaskCommentModel.find({ task_id: task.id }).sort({ created_at: 1 }).lean(),
  ]);

  const commentUsers = await UserModel.find({
    id: { $in: comments.map((c) => c.user_id) },
  }).lean();
  const userMap = new Map(commentUsers.map((u) => [String(u.id), u]));

  return {
    id: String(task.id),
    title: String(task.title),
    description: (task.description as string | null) ?? null,
    project_id: String(task.project_id),
    assigned_to: (task.assigned_to as string | null) ?? null,
    due_date: (task.due_date as string | null) ?? null,
    priority: task.priority as PriorityLevel,
    status: task.status as TaskStatus,
    created_by: (task.created_by as string | null) ?? null,
    created_at: toIso(task.created_at as Date) ?? new Date().toISOString(),
    updated_at: toIso(task.updated_at as Date) ?? new Date().toISOString(),
    deleted_at: toIso(task.deleted_at as Date | null),
    project: project
      ? { id: String(project.id), name: String(project.name) }
      : null,
    assignee: assignee
      ? { id: String(assignee.id), full_name: String(assignee.full_name) }
      : null,
    comments: comments.map((c) => ({
      id: String(c.id),
      task_id: String(c.task_id),
      user_id: String(c.user_id),
      content: String(c.content),
      created_at: toIso(c.created_at) ?? new Date().toISOString(),
      profile: userMap.get(String(c.user_id))
        ? {
            id: String(userMap.get(String(c.user_id))!.id),
            full_name: String(userMap.get(String(c.user_id))!.full_name),
          }
        : null,
    })),
  };
}

export async function getTasks(params?: {
  page?: number;
  search?: string;
  status?: string;
  project_id?: string;
  assigned_to?: string;
  mine?: boolean;
}) {
  const profile = await requireProfile();
  if (profile.role === "client") {
    throw new Error("Use the client portal for your tasks");
  }
  await connectMongo();
  const page = params?.page ?? 1;
  const filter: Record<string, unknown> = { deleted_at: null };

  if (params?.search) filter.title = { $regex: params.search, $options: "i" };
  if (params?.status) filter.status = params.status;
  if (params?.project_id) filter.project_id = params.project_id;
  if (params?.assigned_to) filter.assigned_to = params.assigned_to;
  if (params?.mine || profile.role === "employee") {
    filter.assigned_to = profile.id;
  }

  const count = await TaskModel.countDocuments(filter);
  const rows = await TaskModel.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const data = await Promise.all(
    rows.map((r) => attachTask(r as Record<string, unknown>))
  );

  return {
    data,
    count,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)),
  };
}

export async function getTask(id: string) {
  await connectMongo();
  const task = await TaskModel.findOne({ id, deleted_at: null }).lean();
  if (!task) throw new Error("Task not found");
  return attachTask(task as Record<string, unknown>);
}

export async function createTaskAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "tasks.create")) {
    return { success: false, error: "Permission denied" };
  }

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    project_id: formData.get("project_id"),
    assigned_to: formData.get("assigned_to") || null,
    due_date: formData.get("due_date") || null,
    priority: formData.get("priority") || "medium",
    status: formData.get("status") || "todo",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  const id = newId();
  await TaskModel.create({
    id,
    ...parsed.data,
    assigned_to: parsed.data.assigned_to || null,
    due_date: parsed.data.due_date || null,
    created_by: profile.id,
  });

  if (parsed.data.assigned_to) {
    await createNotification({
      user_id: parsed.data.assigned_to,
      title: "New task assigned",
      message: `You were assigned: ${parsed.data.title}`,
      link: `/tasks/${id}`,
    });
  }

  await logActivity({
    action: "created",
    entity_type: "task",
    entity_id: id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, data: { id } };
}

export async function updateTaskAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "tasks.update")) {
    return { success: false, error: "Permission denied" };
  }

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    project_id: formData.get("project_id"),
    assigned_to: formData.get("assigned_to") || null,
    due_date: formData.get("due_date") || null,
    priority: formData.get("priority") || "medium",
    status: formData.get("status") || "todo",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  const updated = await TaskModel.findOneAndUpdate(
    { id, deleted_at: null },
    {
      ...parsed.data,
      assigned_to: parsed.data.assigned_to || null,
      due_date: parsed.data.due_date || null,
    },
    { new: true }
  ).lean();

  if (!updated) return { success: false, error: "Task not found" };

  await logActivity({
    action: "updated",
    entity_type: "task",
    entity_id: id,
    metadata: { title: updated.title, status: updated.status },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/dashboard");
  return { success: true, data: { id } };
}

export async function addTaskCommentAction(
  taskId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = commentSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  const id = newId();
  await TaskCommentModel.create({
    id,
    task_id: taskId,
    user_id: profile.id,
    content: parsed.data.content,
  });

  revalidatePath(`/tasks/${taskId}`);
  return { success: true, data: { id } };
}

export async function softDeleteTaskAction(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "tasks.create")) {
    return { success: false, error: "Permission denied" };
  }

  await connectMongo();
  await TaskModel.updateOne({ id }, { deleted_at: new Date() });
  await logActivity({
    action: "soft_deleted",
    entity_type: "task",
    entity_id: id,
  });
  revalidatePath("/tasks");
  return { success: true };
}
