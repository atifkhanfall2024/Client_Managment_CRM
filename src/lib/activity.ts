import { connectMongo } from "@/lib/mongodb";
import { ActivityLogModel, NotificationModel, newId } from "@/lib/db/models";
import { getSession } from "@/lib/auth/session";
import type { EntityType } from "@/types/database";

export async function logActivity(params: {
  action: string;
  entity_type: EntityType;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await connectMongo();
  const session = await getSession();

  await ActivityLogModel.create({
    id: newId(),
    actor_id: session?.sub ?? null,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    metadata: params.metadata ?? {},
  });
}

export async function createNotification(params: {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  await connectMongo();
  await NotificationModel.create({
    id: newId(),
    user_id: params.user_id,
    title: params.title,
    message: params.message,
    type: params.type ?? "info",
    link: params.link ?? null,
  });
}
