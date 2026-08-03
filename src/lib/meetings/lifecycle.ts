import { connectMongo } from "@/lib/mongodb";
import { ProjectMeetingModel } from "@/lib/db/models";
import { bustMeetings } from "@/lib/cache";

const notDeleted = {
  $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
};

function meetingEndMs(scheduledAt: string, durationMinutes: number) {
  const start = new Date(scheduledAt);
  if (Number.isNaN(start.getTime())) return null;
  return start.getTime() + Math.max(0, durationMinutes) * 60_000;
}

/**
 * - Past scheduled meetings (time + duration over, not marked done) → cancelled/expired
 * - Exact duplicate rows (same project/title/time) → soft-delete extras
 */
export async function syncMeetingLifecycle() {
  await connectMongo();
  const now = Date.now();
  let changed = false;

  const scheduled = await ProjectMeetingModel.find({
    status: "scheduled",
    ...notDeleted,
  })
    .select("id scheduled_at duration_minutes notes")
    .lean();

  const expiredIds: string[] = [];
  const expiredEmptyNotes: string[] = [];

  for (const row of scheduled) {
    const end = meetingEndMs(
      String(row.scheduled_at),
      Number(row.duration_minutes ?? 30)
    );
    if (end === null || end >= now) continue;
    const id = String(row.id);
    expiredIds.push(id);
    if (!row.notes) expiredEmptyNotes.push(id);
  }

  if (expiredIds.length) {
    await ProjectMeetingModel.updateMany(
      { id: { $in: expiredIds } },
      { status: "cancelled" }
    );
    if (expiredEmptyNotes.length) {
      await ProjectMeetingModel.updateMany(
        { id: { $in: expiredEmptyNotes } },
        {
          notes:
            "Auto-closed — meeting time passed without being marked completed.",
        }
      );
    }
    changed = true;
  }

  // Soft-delete duplicate meetings (keep earliest created)
  const rows = await ProjectMeetingModel.find(notDeleted)
    .select("id project_id title scheduled_at created_at")
    .sort({ created_at: 1 })
    .lean();

  const keep = new Set<string>();
  const remove: string[] = [];
  for (const row of rows) {
    const key = `${row.project_id}|${String(row.title).trim().toLowerCase()}|${row.scheduled_at}`;
    if (keep.has(key)) remove.push(String(row.id));
    else keep.add(key);
  }

  if (remove.length) {
    await ProjectMeetingModel.updateMany(
      { id: { $in: remove } },
      { deleted_at: new Date() }
    );
    changed = true;
  }

  if (changed) bustMeetings();
  return { expired: expiredIds.length, duplicatesRemoved: remove.length };
}
