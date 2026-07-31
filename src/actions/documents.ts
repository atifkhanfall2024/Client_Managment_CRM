"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { requireStaffProfile } from "@/lib/auth/require-staff";
import { connectMongo } from "@/lib/mongodb";
import {
  ClientModel,
  DocumentModel,
  ProjectModel,
  newId,
  toIso,
} from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import { saveUpload, deleteUpload } from "@/lib/storage";
import { hasPermission } from "@/lib/rbac";
import { canAccessDocument } from "@/lib/security/file-access";
import type { ActionResult } from "@/core/types/result";
import type { EntityType } from "@/types/database";

const notDeleted = {
  $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
};

async function clientScopeForProfile(profileId: string) {
  const client = await ClientModel.findOne({
    portal_user_id: profileId,
    ...notDeleted,
  }).lean();
  if (!client) {
    return { clientId: null as string | null, projectIds: [] as string[] };
  }
  const projects = await ProjectModel.find({
    client_id: client.id,
    ...notDeleted,
  })
    .select("id")
    .lean();
  return {
    clientId: String(client.id),
    projectIds: projects.map((p) => String(p.id)),
  };
}

export async function getDocuments(params?: {
  entity_type?: EntityType;
  entity_id?: string;
}) {
  const profile = await requireProfile();
  await connectMongo();

  const filter: Record<string, unknown> = { deleted_at: null };

  if (profile.role === "client") {
    const scope = await clientScopeForProfile(profile.id);
    if (!scope.clientId) return [];

    if (params?.entity_type && params?.entity_id) {
      const ok = canAccessDocument({
        role: "client",
        hasDocumentsView: true,
        clientId: scope.clientId,
        clientProjectIds: scope.projectIds,
        doc: {
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          file_path: "",
        },
      });
      if (!ok) return [];
      filter.entity_type = params.entity_type;
      filter.entity_id = params.entity_id;
    } else {
      filter.$or = [
        { entity_type: "client", entity_id: scope.clientId },
        { entity_type: "project", entity_id: { $in: scope.projectIds } },
      ];
    }
  } else {
    if (!hasPermission(profile.role, "documents.view")) return [];
    if (params?.entity_type) filter.entity_type = params.entity_type;
    if (params?.entity_id) filter.entity_id = params.entity_id;
  }

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
  const profile = await requireStaffProfile();
  if (!hasPermission(profile.role, "documents.upload")) {
    return { success: false, error: "Permission denied" };
  }

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
    file_name: file.name,
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
  const profile = await requireStaffProfile();
  if (!hasPermission(profile.role, "documents.upload")) {
    return { success: false, error: "Permission denied" };
  }

  await connectMongo();
  const doc = await DocumentModel.findOne({ id }).lean();
  if (!doc) return { success: false, error: "Not found" };

  await DocumentModel.updateOne({ id }, { deleted_at: new Date() });
  if (doc.file_path) await deleteUpload(doc.file_path);

  revalidatePath("/documents");
  return { success: true };
}
