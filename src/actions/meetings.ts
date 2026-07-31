"use server";

import { revalidatePath } from "next/cache";
import { requireStaffProfile } from "@/lib/auth/require-staff";
import { connectMongo } from "@/lib/mongodb";
import {
  ClientModel,
  ProjectMeetingModel,
  ProjectModel,
  newId,
  toIso,
} from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import { createNotification, logActivity } from "@/lib/activity";
import { hasPermission } from "@/lib/rbac";
import { meetingSchema } from "@/lib/validations";
import type { ActionResult } from "@/core/types/result";
import type { MeetingStatus } from "@/types/database";

const notDeleted = {
  $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
};

function mapMeeting(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    client_id: String(row.client_id),
    title: String(row.title),
    agenda: (row.agenda as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    scheduled_at: String(row.scheduled_at),
    duration_minutes: Number(row.duration_minutes ?? 30),
    location: (row.location as string | null) ?? null,
    meeting_url: (row.meeting_url as string | null) ?? null,
    status: row.status as MeetingStatus,
    created_by: (row.created_by as string | null) ?? null,
    manager_id: (row.manager_id as string | null) ?? null,
    visible_to_client: Boolean(row.visible_to_client ?? true),
    deleted_at: toIso(row.deleted_at as Date | null),
    created_at: toIso(row.created_at as Date) ?? new Date().toISOString(),
    updated_at: toIso(row.updated_at as Date) ?? new Date().toISOString(),
  };
}

async function attachMeetingMeta(row: Record<string, unknown>) {
  const base = mapMeeting(row);
  const [project, manager] = await Promise.all([
    ProjectModel.findOne({ id: base.project_id }).select("id name").lean(),
    base.manager_id
      ? UserModel.findOne({ id: base.manager_id })
          .select("id full_name email")
          .lean()
      : null,
  ]);
  return {
    ...base,
    project: project
      ? { id: String(project.id), name: String(project.name) }
      : null,
    manager: manager
      ? {
          id: String(manager.id),
          full_name: String(manager.full_name),
          email: String(manager.email),
        }
      : null,
  };
}

export async function getMeetings(params?: {
  project_id?: string;
  client_id?: string;
  status?: MeetingStatus;
}) {
  await requireStaffProfile();
  await connectMongo();
  const filter: Record<string, unknown> = { ...notDeleted };
  if (params?.project_id) filter.project_id = params.project_id;
  if (params?.client_id) filter.client_id = params.client_id;
  if (params?.status) filter.status = params.status;

  const rows = await ProjectMeetingModel.find(filter)
    .sort({ scheduled_at: 1 })
    .lean();

  return Promise.all(
    rows.map((r) => attachMeetingMeta(r as Record<string, unknown>))
  );
}

export async function getProjectMeetings(projectId: string) {
  return getMeetings({ project_id: projectId });
}

export async function createMeetingAction(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return scheduleMeetingForProject(projectId, formData);
}

/** Meetings page: project_id comes from the form. */
export async function createMeetingFromPageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const projectId = String(formData.get("project_id") || "").trim();
  if (!projectId) {
    return { success: false, error: "Select a project first" };
  }
  return scheduleMeetingForProject(projectId, formData);
}

async function scheduleMeetingForProject(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireStaffProfile();
  if (!hasPermission(profile.role, "projects.update")) {
    return { success: false, error: "Permission denied" };
  }

  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    agenda: formData.get("agenda") || null,
    notes: formData.get("notes") || null,
    scheduled_at: formData.get("scheduled_at"),
    duration_minutes: formData.get("duration_minutes") || 30,
    location: formData.get("location") || null,
    meeting_url: formData.get("meeting_url") || null,
    manager_id: formData.get("manager_id") || null,
    visible_to_client: formData.get("visible_to_client") !== "false",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid meeting",
    };
  }

  await connectMongo();
  const project = await ProjectModel.findOne({
    id: projectId,
    ...notDeleted,
  }).lean();
  if (!project) return { success: false, error: "Project not found" };

  const managerId =
    parsed.data.manager_id ||
    (project.manager_id as string | null) ||
    profile.id;

  const id = newId();
  await ProjectMeetingModel.create({
    id,
    project_id: projectId,
    client_id: project.client_id,
    title: parsed.data.title,
    agenda: parsed.data.agenda || null,
    notes: parsed.data.notes || null,
    scheduled_at: parsed.data.scheduled_at,
    duration_minutes: parsed.data.duration_minutes,
    location: parsed.data.location || null,
    meeting_url: parsed.data.meeting_url || null,
    status: "scheduled",
    created_by: profile.id,
    manager_id: managerId,
    visible_to_client: parsed.data.visible_to_client ?? true,
  });

  await logActivity({
    action: "meeting.scheduled",
    entity_type: "meeting",
    entity_id: id,
    metadata: { project_id: projectId, title: parsed.data.title },
  });

  const client = await ClientModel.findOne({
    id: project.client_id,
    ...notDeleted,
  }).lean();
  if (client?.portal_user_id && (parsed.data.visible_to_client ?? true)) {
    await createNotification({
      user_id: String(client.portal_user_id),
      title: "New project meeting",
      message: `${parsed.data.title} scheduled for ${project.name}.`,
      type: "meeting",
      link: `/portal/projects/${projectId}`,
    });
  }

  if (managerId && managerId !== profile.id) {
    await createNotification({
      user_id: managerId,
      title: "Meeting assigned",
      message: `You have a meeting on ${project.name}: ${parsed.data.title}`,
      type: "meeting",
      link: `/projects/${projectId}`,
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/meetings");
  revalidatePath("/portal");
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal/meetings");
  return { success: true, data: { id } };
}

export async function updateMeetingStatusAction(
  meetingId: string,
  status: MeetingStatus,
  notes?: string | null
): Promise<ActionResult> {
  const profile = await requireStaffProfile();
  if (!hasPermission(profile.role, "projects.update")) {
    return { success: false, error: "Permission denied" };
  }

  await connectMongo();
  const meeting = await ProjectMeetingModel.findOne({
    id: meetingId,
    ...notDeleted,
  }).lean();
  if (!meeting) return { success: false, error: "Meeting not found" };

  await ProjectMeetingModel.updateOne(
    { id: meetingId },
    {
      status,
      ...(notes !== undefined ? { notes: notes || null } : {}),
    }
  );

  await logActivity({
    action: `meeting.${status}`,
    entity_type: "meeting",
    entity_id: meetingId,
  });

  const client = await ClientModel.findOne({
    id: meeting.client_id,
    ...notDeleted,
  }).lean();
  if (client?.portal_user_id && meeting.visible_to_client) {
    await createNotification({
      user_id: String(client.portal_user_id),
      title:
        status === "completed"
          ? "Meeting completed"
          : status === "cancelled"
            ? "Meeting cancelled"
            : "Meeting updated",
      message: `${meeting.title} is now ${status.replace("_", " ")}.`,
      type: "meeting",
      link: `/portal/projects/${meeting.project_id}`,
    });
  }

  revalidatePath(`/projects/${meeting.project_id}`);
  revalidatePath("/meetings");
  revalidatePath(`/portal/projects/${meeting.project_id}`);
  return { success: true };
}

export async function cancelMeetingAction(meetingId: string): Promise<void> {
  await updateMeetingStatusAction(meetingId, "cancelled");
}

export async function completeMeetingWithNotesAction(
  meetingId: string,
  formData: FormData
): Promise<void> {
  const notes = String(formData.get("notes") || "").trim();
  await updateMeetingStatusAction(meetingId, "completed", notes || null);
}
