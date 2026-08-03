"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { requireStaffProfile } from "@/lib/auth/require-staff";
import { connectMongo } from "@/lib/mongodb";
import {
  ClientModel,
  FeedbackModel,
  newId,
  toIso,
} from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import { createNotification } from "@/lib/activity";
import { canViewClients } from "@/lib/rbac";
import { bustFeedback } from "@/lib/cache";
import type { ActionResult } from "@/core/types/result";

const notDeleted = {
  $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
};

function mapFeedback(row: Record<string, unknown>) {
  const seenAt = toIso(row.seen_at as Date | null);
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    submitted_by: String(row.submitted_by),
    type: String(row.type) as "feedback" | "feature",
    title: String(row.title),
    message: String(row.message),
    status: String(row.status),
    staff_notes: (row.staff_notes as string | null) ?? null,
    reply: (row.reply as string | null) ?? null,
    seen_at: seenAt,
    seen_by: (row.seen_by as string | null) ?? null,
    is_seen: Boolean(seenAt),
    created_at: toIso(row.created_at as Date) ?? new Date().toISOString(),
    updated_at: toIso(row.updated_at as Date) ?? new Date().toISOString(),
  };
}

async function getLinkedClient(profileId: string) {
  await connectMongo();
  const client = await ClientModel.findOne({
    portal_user_id: profileId,
    ...notDeleted,
  }).lean();
  if (!client) throw new Error("No client linked to this portal account");
  return client;
}

/** Client portal: list own feedback / suggestions. */
export async function getPortalFeedback() {
  const profile = await requireProfile();
  if (profile.role !== "client") throw new Error("Portal access only");
  const client = await getLinkedClient(profile.id);

  const rows = await FeedbackModel.find({
    client_id: client.id,
    ...notDeleted,
  })
    .sort({ created_at: -1 })
    .limit(100)
    .lean();

  return rows.map((r) => mapFeedback(r as Record<string, unknown>));
}

/** Client portal: submit feedback or feature suggestion. */
export async function submitPortalFeedbackAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "client") {
    return { success: false, error: "Only clients can submit feedback" };
  }

  const type = String(formData.get("type") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (type !== "feedback" && type !== "feature") {
    return { success: false, error: "Select feedback or feature suggestion" };
  }
  if (title.length < 3) {
    return { success: false, error: "Title is required" };
  }
  if (message.length < 10) {
    return { success: false, error: "Please write a bit more detail" };
  }

  const client = await getLinkedClient(profile.id);
  const id = newId();

  await FeedbackModel.create({
    id,
    client_id: client.id,
    submitted_by: profile.id,
    type,
    title,
    message,
    status: "new",
    seen_at: null,
    seen_by: null,
    reply: null,
  });

  const staff = await UserModel.find({
    role: { $in: ["super_admin", "admin", "manager"] },
    is_active: true,
    approval_status: "approved",
    ...notDeleted,
  })
    .select("id")
    .lean();

  const label = type === "feature" ? "feature suggestion" : "feedback";
  await Promise.all(
    staff.map((u) =>
      createNotification({
        user_id: String(u.id),
        title: `New client ${label}`,
        message: `${client.name}: ${title}`,
        type: "feedback",
        link: `/feedback`,
      })
    )
  );

  bustFeedback();
  revalidatePath("/portal/feedback");
  revalidatePath("/feedback");
  return { success: true, data: { id } };
}

/** Admin / manager inbox. */
export async function getStaffFeedback(params?: { status?: string }) {
  const profile = await requireStaffProfile();
  if (!canViewClients(profile.role)) {
    return [];
  }

  await connectMongo();
  const filter: Record<string, unknown> = { ...notDeleted };
  if (params?.status) filter.status = params.status;

  const rows = await FeedbackModel.find(filter)
    .sort({ created_at: -1 })
    .limit(200)
    .lean();

  const clientIds = [...new Set(rows.map((r) => String(r.client_id)))];
  const clients = clientIds.length
    ? await ClientModel.find({ id: { $in: clientIds } })
        .select("id name")
        .lean()
    : [];
  const clientMap = new Map(clients.map((c) => [String(c.id), String(c.name)]));

  return rows.map((r) => ({
    ...mapFeedback(r as Record<string, unknown>),
    client_name: clientMap.get(String(r.client_id)) ?? "Client",
  }));
}

/** Mark feedback as seen by staff (without requiring full status change). */
export async function markFeedbackSeenAction(
  id: string
): Promise<ActionResult> {
  const profile = await requireStaffProfile();
  if (!canViewClients(profile.role)) {
    return { success: false, error: "Permission denied" };
  }

  await connectMongo();
  const existing = await FeedbackModel.findOne({ id, ...notDeleted }).lean();
  if (!existing) return { success: false, error: "Not found" };

  if (!existing.seen_at) {
    await FeedbackModel.updateOne(
      { id },
      {
        $set: {
          seen_at: new Date(),
          seen_by: profile.id,
          status:
            existing.status === "new" ? "reviewed" : existing.status,
        },
      }
    );

    if (existing.submitted_by) {
      await createNotification({
        user_id: String(existing.submitted_by),
        title: "Your feedback was seen",
        message: `Team has seen "${existing.title}".`,
        type: "feedback",
        link: `/portal/feedback`,
      });
    }

    bustFeedback();
    revalidatePath("/feedback");
    revalidatePath("/portal/feedback");
  }

  return { success: true };
}

export async function updateFeedbackStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireStaffProfile();
  if (!canViewClients(profile.role)) {
    return { success: false, error: "Permission denied" };
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) return { success: false, error: "Missing feedback id" };

  const status = String(formData.get("status") || "").trim();
  const staff_notes = String(formData.get("staff_notes") || "").trim() || null;
  const reply = String(formData.get("reply") || "").trim() || null;
  const allowed = ["new", "reviewed", "planned", "done", "dismissed"];
  if (!allowed.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  await connectMongo();
  const existing = await FeedbackModel.findOne({ id, ...notDeleted }).lean();
  if (!existing) return { success: false, error: "Not found" };

  const wasSeen = Boolean(existing.seen_at);
  const setDoc: Record<string, unknown> = {
    status,
    staff_notes,
    reply,
  };
  if (!wasSeen) {
    setDoc.seen_at = new Date();
    setDoc.seen_by = profile.id;
  }

  const updated = await FeedbackModel.findOneAndUpdate(
    { id, ...notDeleted },
    { $set: setDoc },
    { returnDocument: "after" }
  ).lean();

  if (!updated) return { success: false, error: "Not found" };

  if (updated.submitted_by) {
    const parts = [
      `"${updated.title}" is now marked as ${status}.`,
      reply ? `Team reply: ${reply}` : null,
      !wasSeen ? "Your message was marked as seen." : null,
    ].filter(Boolean);

    await createNotification({
      user_id: String(updated.submitted_by),
      title: reply ? "New reply on your feedback" : "Update on your feedback",
      message: parts.join(" "),
      type: "feedback",
      link: `/portal/feedback`,
    });
  }

  bustFeedback();
  revalidatePath("/feedback");
  revalidatePath("/portal/feedback");
  return { success: true };
}
