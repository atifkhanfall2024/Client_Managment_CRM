"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { DocumentModel, newId, toIso } from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import { saveUpload, deleteUpload } from "@/lib/storage";
import type { ActionResult } from "@/core/types/result";
import type { EntityType } from "@/types/database";

export async function getDocuments(params?: {
  entity_type?: EntityType;
  entity_id?: string;
}) {
  await connectMongo();
  const filter: Record<string, unknown> = { deleted_at: null };
  if (params?.entity_type) filter.entity_type = params.entity_type;
  if (params?.entity_id) filter.entity_id = params.entity_id;

  const rows = await DocumentModel.find(filter)
    .sort({ created_at: -1 })
    .lean();

  const uploaders = await UserModel.find({
    id: { $in: rows.map((r) => r.uploaded_by).filter(Boolean) },
  }).lean();
  const map = new Map(uploaders.map((u) => [u.id, u]));

  return rows.map((doc) => ({
    ...doc,
    created_at: toIso(doc.created_at) ?? new Date().toISOString(),
    deleted_at: toIso(doc.deleted_at),
    uploader: doc.uploaded_by
      ? {
          id: map.get(doc.uploaded_by)?.id,
          full_name: map.get(doc.uploaded_by)?.full_name,
        }
      : null,
  }));
}

export async function uploadDocumentAction(
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  const file = formData.get("file") as File | null;
  const entity_type = formData.get("entity_type") as EntityType;
  const entity_id = formData.get("entity_id") as string;

  if (!file || !entity_type || !entity_id) {
    return { success: false, error: "File and entity are required" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File must be under 10MB" };
  }

  const saved = await saveUpload(file, `${entity_type}/${entity_id}`);
  await connectMongo();
  const id = newId();

  await DocumentModel.create({
    id,
    name: file.name,
    file_path: saved.relativePath,
    file_size: saved.size,
    mime_type: saved.mimeType,
    entity_type,
    entity_id,
    uploaded_by: profile.id,
  });

  revalidatePath("/documents");
  return { success: true, data: { id } };
}

export async function softDeleteDocumentAction(id: string): Promise<ActionResult> {
  await connectMongo();
  const doc = await DocumentModel.findOne({ id }).lean();
  if (!doc) return { success: false, error: "Not found" };

  await DocumentModel.updateOne({ id }, { deleted_at: new Date() });
  if (doc.file_path) await deleteUpload(doc.file_path);

  revalidatePath("/documents");
  return { success: true };
}
