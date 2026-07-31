"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import {
  ClientModel,
  DocumentModel,
  ProjectMeetingModel,
  ProjectModel,
  TaskModel,
  newId,
  toIso,
} from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import { hasPermission, isStaffRole } from "@/lib/rbac";
import { createNotification } from "@/lib/activity";
import { notifyApproversOfRegistration } from "@/actions/approvals";
import type { ActionResult } from "@/core/types/result";
import type { ApprovalStatus } from "@/types/database";

const notDeleted = {
  $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
};

export async function getPortalClient() {
  const profile = await requireProfile();
  if (profile.role !== "client") {
    throw new Error("Portal access only");
  }
  await connectMongo();
  const client = await ClientModel.findOne({
    portal_user_id: profile.id,
    ...notDeleted,
  }).lean();
  if (!client) {
    throw new Error("No client record linked to this portal account");
  }
  return {
    id: String(client.id),
    name: String(client.name),
    email: (client.email as string | null) ?? null,
    phone: (client.phone as string | null) ?? null,
    status: String(client.status),
    industry: (client.industry as string | null) ?? null,
    requirements: (client.requirements as string | null) ?? null,
    portal_user_id: profile.id,
  };
}

export async function getPortalProjects() {
  const client = await getPortalClient();
  await connectMongo();
  const rows = await ProjectModel.find({
    client_id: client.id,
    ...notDeleted,
  })
    .sort({ updated_at: -1 })
    .lean();

  return rows.map((p) => ({
    id: String(p.id),
    name: String(p.name),
    status: String(p.status),
    progress: Number(p.progress ?? 0),
    budget: Number(p.budget ?? 0),
    deadline: (p.deadline as string | null) ?? null,
    description: (p.description as string | null) ?? null,
    priority: String(p.priority),
    updated_at: toIso(p.updated_at as Date) ?? new Date().toISOString(),
  }));
}

export async function getPortalProject(projectId: string) {
  const client = await getPortalClient();
  await connectMongo();
  const project = await ProjectModel.findOne({
    id: projectId,
    client_id: client.id,
    ...notDeleted,
  }).lean();
  if (!project) throw new Error("Project not found");

  const [tasks, documents, meetings, manager] = await Promise.all([
    TaskModel.find({ project_id: projectId, ...notDeleted })
      .sort({ updated_at: -1 })
      .lean(),
    DocumentModel.find({
      entity_type: "project",
      entity_id: projectId,
      ...notDeleted,
    })
      .sort({ created_at: -1 })
      .lean(),
    ProjectMeetingModel.find({
      project_id: projectId,
      client_id: client.id,
      deleted_at: null,
      $or: [
        { visible_to_client: true },
        { visible_to_client: { $exists: false } },
      ],
    })
      .sort({ scheduled_at: -1 })
      .lean(),
    project.manager_id
      ? UserModel.findOne({ id: project.manager_id })
          .select("id full_name email")
          .lean()
      : null,
  ]);

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return {
    client,
    project: {
      id: String(project.id),
      name: String(project.name),
      status: String(project.status),
      progress: Number(project.progress ?? 0),
      budget: Number(project.budget ?? 0),
      deadline: (project.deadline as string | null) ?? null,
      description: (project.description as string | null) ?? null,
      priority: String(project.priority),
      updated_at: toIso(project.updated_at as Date) ?? new Date().toISOString(),
    },
    manager: manager
      ? {
          id: String(manager.id),
          full_name: String(manager.full_name),
          email: String(manager.email),
        }
      : null,
    taskStats,
    tasks: tasks.map((t) => ({
      id: String(t.id),
      title: String(t.title),
      description: (t.description as string | null) ?? null,
      status: String(t.status),
      priority: String(t.priority),
      due_date: (t.due_date as string | null) ?? null,
    })),
    documents: documents.map((d) => ({
      id: String(d.id),
      file_name: String(d.file_name ?? d.name ?? "file"),
      file_path: String(d.file_path),
      created_at: toIso(d.created_at as Date) ?? new Date().toISOString(),
    })),
    meetings: meetings.map((m) => ({
      id: String(m.id),
      title: String(m.title),
      agenda: (m.agenda as string | null) ?? null,
      notes: (m.notes as string | null) ?? null,
      scheduled_at: String(m.scheduled_at),
      duration_minutes: Number(m.duration_minutes ?? 30),
      location: (m.location as string | null) ?? null,
      meeting_url: (m.meeting_url as string | null) ?? null,
      status: String(m.status),
    })),
  };
}

export async function getPortalMeetings() {
  const client = await getPortalClient();
  await connectMongo();
  const meetings = await ProjectMeetingModel.find({
    client_id: client.id,
    deleted_at: null,
    $or: [
      { visible_to_client: true },
      { visible_to_client: { $exists: false } },
    ],
  })
    .sort({ scheduled_at: -1 })
    .lean();

  const projectIds = [...new Set(meetings.map((m) => String(m.project_id)))];
  const projects = projectIds.length
    ? await ProjectModel.find({ id: { $in: projectIds } })
        .select("id name")
        .lean()
    : [];
  const projectMap = new Map(
    projects.map((p) => [String(p.id), String(p.name)])
  );

  return meetings.map((m) => ({
    id: String(m.id),
    project_id: String(m.project_id),
    project_name: projectMap.get(String(m.project_id)) ?? "Project",
    title: String(m.title),
    agenda: (m.agenda as string | null) ?? null,
    notes: (m.notes as string | null) ?? null,
    scheduled_at: String(m.scheduled_at),
    duration_minutes: Number(m.duration_minutes ?? 30),
    location: (m.location as string | null) ?? null,
    meeting_url: (m.meeting_url as string | null) ?? null,
    status: String(m.status),
  }));
}

export async function getPortalOverview() {
  const client = await getPortalClient();
  const projects = await getPortalProjects();
  await connectMongo();

  const projectIds = projects.map((p) => p.id);
  const [tasks, documents, meetings] = await Promise.all([
    projectIds.length
      ? TaskModel.find({
          project_id: { $in: projectIds },
          ...notDeleted,
        }).lean()
      : Promise.resolve([]),
    DocumentModel.find({
      deleted_at: null,
      $or: [
        { entity_type: "client", entity_id: client.id },
        ...(projectIds.length
          ? [{ entity_type: "project", entity_id: { $in: projectIds } }]
          : []),
      ],
    }).lean(),
    ProjectMeetingModel.find({
      client_id: client.id,
      deleted_at: null,
      $or: [
        { visible_to_client: true },
        { visible_to_client: { $exists: false } },
      ],
    })
      .sort({ scheduled_at: 1 })
      .lean(),
  ]);

  const openTasks = tasks.filter((t) =>
    ["todo", "in_progress", "review"].includes(String(t.status))
  ).length;
  const doneTasks = tasks.filter((t) => String(t.status) === "done").length;
  const active = projects.filter((p) =>
    ["planning", "in_progress", "on_hold"].includes(p.status)
  ).length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const avgProgress =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce((s, p) => s + p.progress, 0) / projects.length
        );

  const upcomingMeetings = meetings
    .filter((m) => String(m.status) === "scheduled")
    .slice(0, 5)
    .map((m) => ({
      id: String(m.id),
      project_id: String(m.project_id),
      title: String(m.title),
      scheduled_at: String(m.scheduled_at),
      duration_minutes: Number(m.duration_minutes ?? 30),
      meeting_url: (m.meeting_url as string | null) ?? null,
      status: String(m.status),
    }));

  return {
    client,
    projects,
    active,
    completed,
    avgProgress,
    openTasks,
    doneTasks,
    documentCount: documents.length,
    upcomingMeetings,
    meetingCount: meetings.length,
    recentDocuments: documents.slice(0, 5).map((d) => ({
      id: String(d.id),
      file_name: String(d.file_name ?? d.name ?? "file"),
      file_path: String(d.file_path),
      entity_type: String(d.entity_type),
      created_at: toIso(d.created_at as Date) ?? new Date().toISOString(),
    })),
  };
}

/** Staff creates/links a portal login — starts pending until admin/super_admin approves. */
export async function enableClientPortalAction(
  clientId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!isStaffRole(profile.role) || !hasPermission(profile.role, "clients.update")) {
    return { success: false, error: "Permission denied" };
  }

  const email = String(formData.get("portal_email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("portal_password") || "");
  const full_name = String(formData.get("portal_name") || "").trim();

  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid portal email required" };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  await connectMongo();
  const client = await ClientModel.findOne({
    id: clientId,
    ...notDeleted,
  }).lean();
  if (!client) return { success: false, error: "Client not found" };

  const existingUser = await UserModel.findOne({ email }).lean();
  const currentPortalId = (client.portal_user_id as string | null) ?? null;

  let otherClientUsingThisPortalUser = false;
  if (existingUser) {
    const linkedElsewhere = await ClientModel.findOne({
      portal_user_id: existingUser.id,
      id: { $ne: clientId },
      ...notDeleted,
    })
      .select("id")
      .lean();
    otherClientUsingThisPortalUser = Boolean(linkedElsewhere);
  }

  const { canUseEmailForClientPortal } = await import(
    "@/lib/security/portal-email"
  );
  const emailCheck = canUseEmailForClientPortal({
    existingUser: existingUser
      ? { id: String(existingUser.id), role: String(existingUser.role) }
      : null,
    currentClientPortalUserId: currentPortalId,
    otherClientUsingThisPortalUser,
  });
  if (!emailCheck.ok) {
    return { success: false, error: emailCheck.error };
  }

  let userId: string;
  let needsApproval = true;

  if (existingUser) {
    // Only reached when this is the same portal user for this client
    userId = String(existingUser.id);
    const alreadyApproved = existingUser.approval_status === "approved";
    needsApproval = !alreadyApproved;
    await UserModel.updateOne(
      { id: userId },
      {
        full_name: full_name || existingUser.full_name,
        passwordHash: await hash(password, 12),
        role: "client",
        approval_status: alreadyApproved ? "approved" : "pending",
        is_active: true,
        deleted_at: null,
      }
    );
  } else {
    userId = newId();
    await UserModel.create({
      id: userId,
      email,
      passwordHash: await hash(password, 12),
      full_name: full_name || String(client.name),
      role: "client",
      is_active: true,
      approval_status: "pending",
    });
  }

  await ClientModel.updateOne(
    { id: clientId },
    { portal_user_id: userId, email: client.email || email }
  );

  if (needsApproval) {
    await notifyApproversOfRegistration({
      full_name: full_name || String(client.name),
      email,
      role: "client",
      userId,
    });
    await createNotification({
      user_id: userId,
      title: "Portal access pending",
      message: `Your portal login for ${client.name} was created. An admin must approve it before you can enter.`,
      link: "/pending",
    });
  } else {
    await createNotification({
      user_id: userId,
      title: "Portal login updated",
      message: `Your WrapCRM portal credentials for ${client.name} were updated.`,
      link: "/portal",
    });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/approvals");
  return {
    success: true,
    data: {
      email,
      pending: needsApproval,
      message: needsApproval
        ? "Portal login created. Admin must approve before the client can enter."
        : "Portal login updated. Client can sign in with the new password.",
    },
  };
}

export async function getPortalUserStatus(clientId: string): Promise<{
  linked: boolean;
  approval_status: ApprovalStatus | null;
  email: string | null;
}> {
  const profile = await requireProfile();
  if (!isStaffRole(profile.role)) {
    return { linked: false, approval_status: null, email: null };
  }
  await connectMongo();
  const client = await ClientModel.findOne({ id: clientId, ...notDeleted }).lean();
  if (!client?.portal_user_id) {
    return { linked: false, approval_status: null, email: null };
  }
  const user = await UserModel.findOne({ id: client.portal_user_id }).lean();
  if (!user) {
    return { linked: false, approval_status: null, email: null };
  }
  return {
    linked: true,
    approval_status: (user.approval_status as ApprovalStatus) ?? "pending",
    email: String(user.email),
  };
}
