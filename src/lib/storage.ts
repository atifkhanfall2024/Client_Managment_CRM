import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { newId } from "@/lib/db/models";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function saveUpload(file: File, folder: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filename = `${newId()}.${ext}`;
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const relativePath = path.join(folder, filename).replace(/\\/g, "/");
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);
  await writeFile(absolutePath, bytes);
  return {
    relativePath,
    size: bytes.length,
    mimeType: file.type || null,
  };
}

export function resolveUploadPath(relativePath: string) {
  const safe = relativePath.replace(/\.\./g, "");
  return path.join(UPLOAD_ROOT, safe);
}

export async function deleteUpload(relativePath: string) {
  try {
    await unlink(resolveUploadPath(relativePath));
  } catch {
    // file may already be gone
  }
}
