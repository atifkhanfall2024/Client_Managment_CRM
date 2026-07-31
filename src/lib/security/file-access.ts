import type { EntityType, UserRole } from "@/types/database";

export type DocumentAccessRecord = {
  entity_type: EntityType | string;
  entity_id: string;
  file_path: string;
};

/**
 * Pure ACL: can this principal download a document row?
 * Staff with documents.view → yes. Clients → only their client/project docs.
 */
export function canAccessDocument(params: {
  role: UserRole;
  hasDocumentsView: boolean;
  clientId: string | null;
  clientProjectIds: string[];
  doc: DocumentAccessRecord;
}): boolean {
  if (params.role !== "client") {
    return params.hasDocumentsView;
  }
  if (!params.clientId) return false;

  if (
    params.doc.entity_type === "client" &&
    params.doc.entity_id === params.clientId
  ) {
    return true;
  }
  if (
    params.doc.entity_type === "project" &&
    params.clientProjectIds.includes(params.doc.entity_id)
  ) {
    return true;
  }
  return false;
}

/** Normalize relative upload paths and reject traversal attempts. */
export function sanitizeRelativeUploadPath(relativePath: string): string | null {
  if (!relativePath || relativePath.includes("\0")) return null;
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) return null;
  return normalized;
}
