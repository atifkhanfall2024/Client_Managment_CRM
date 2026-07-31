import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { newId } from "@/lib/db/models";
import { sanitizeRelativeUploadPath } from "@/lib/security/file-access";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function saveUpload(file: File, folder: string) {
  const safeFolder = sanitizeRelativeUploadPath(folder);
  if (!safeFolder) {
    throw new Error("Invalid upload folder");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filename = `${newId()}.${ext}`;
  const dir = path.join(UPLOAD_ROOT, safeFolder);
  await mkdir(dir, { recursive: true });
  const relativePath = path.join(safeFolder, filename).replace(/\\/g, "/");
  const absolutePath = resolveUploadPath(relativePath);
  await writeFile(absolutePath, bytes);
  return {
    relativePath,
    size: bytes.length,
    mimeType: file.type || null,
  };
}

export function resolveUploadPath(relativePath: string) {
  const safe = sanitizeRelativeUploadPath(relativePath);
  if (!safe) {
    throw new Error("Invalid path");
  }
  const root = path.resolve(UPLOAD_ROOT);
  const resolved = path.resolve(path.join(UPLOAD_ROOT, safe));
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Invalid path");
  }
  return resolved;
}

export async function deleteUpload(relativePath: string) {
  try {
    await unlink(resolveUploadPath(relativePath));
  } catch {
    // file may already be gone
  }
}
