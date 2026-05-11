import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyMembership } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import path from "path";

const EXT_CONTENT_TYPES: Record<string, string> = {
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segments = (await params).path;
  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "No path provided" }, { status: 400 });
  }

  const key = segments.join("/");

  if (key.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const projectIdMatch = key.match(/^projects\/([^/]+)\//);
  if (!projectIdMatch) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const membership = await verifyMembership(projectIdMatch[1], session.userId);
  if (!membership) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const storage = getStorage();

  const exists = await storage.exists(key);
  if (!exists) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileBuffer = await storage.get(key);
  const ext = path.extname(key).toLowerCase();
  const contentType = EXT_CONTENT_TYPES[ext] ?? "application/octet-stream";
  const totalSize = fileBuffer.length;

  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${totalSize}` },
        });
      }

      const chunk = new Uint8Array(fileBuffer.subarray(start, end + 1));

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Content-Length": String(chunk.length),
          "Accept-Ranges": "bytes",
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(totalSize),
      "Accept-Ranges": "bytes",
    },
  });
}
