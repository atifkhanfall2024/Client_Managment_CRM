import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import { getCurrentProfile } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import {
  ClientModel,
  DocumentModel,
  ProjectModel,
} from "@/lib/db/models";
import { resolveUploadPath } from "@/lib/storage";
import { hasPermission } from "@/lib/rbac";
import {
  canAccessDocument,
  sanitizeRelativeUploadPath,
} from "@/lib/security/file-access";

const notDeleted = {
  $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path: parts } = await context.params;
  const relative = sanitizeRelativeUploadPath(parts.join("/"));
  if (!relative) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  let absolute: string;
  try {
    absolute = resolveUploadPath(relative);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  await connectMongo();
  const doc = await DocumentModel.findOne({
    file_path: relative,
    ...notDeleted,
  }).lean();

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let clientId: string | null = null;
  let clientProjectIds: string[] = [];

  if (profile.role === "client") {
    const client = await ClientModel.findOne({
      portal_user_id: profile.id,
      ...notDeleted,
    }).lean();
    if (!client) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    clientId = String(client.id);
    const projects = await ProjectModel.find({
      client_id: clientId,
      ...notDeleted,
    })
      .select("id")
      .lean();
    clientProjectIds = projects.map((p) => String(p.id));
  }

  const allowed = canAccessDocument({
    role: profile.role,
    hasDocumentsView: hasPermission(profile.role, "documents.view"),
    clientId,
    clientProjectIds,
    doc: {
      entity_type: String(doc.entity_type),
      entity_id: String(doc.entity_id),
      file_path: String(doc.file_path),
    },
  });

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!existsSync(absolute)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stat = statSync(absolute);
  const stream = createReadStream(absolute);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Length": String(stat.size),
      "Content-Type": String(doc.mime_type || "application/octet-stream"),
      "Content-Disposition": `inline; filename="${encodeURIComponent(String(doc.file_name ?? doc.name ?? "file"))}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
