import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import { getSession } from "@/lib/auth/session";
import { resolveUploadPath } from "@/lib/storage";
import { Readable } from "stream";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path: parts } = await context.params;
  const relative = parts.join("/");
  const absolute = resolveUploadPath(relative);

  if (!existsSync(absolute)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stat = statSync(absolute);
  const stream = createReadStream(absolute);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Length": String(stat.size),
      "Content-Type": "application/octet-stream",
    },
  });
}
