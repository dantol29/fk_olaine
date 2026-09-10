import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { EXTENSION_BY_MIME_TYPE, UPLOADS_ROOT } from "@/lib/uploads";

const MIME_TYPE_BY_EXTENSION = Object.fromEntries(
  Object.entries(EXTENSION_BY_MIME_TYPE).map(([mime, extension]) => [extension, mime]),
);

/** Serves admin-uploaded photos from UPLOADS_ROOT. Uploads land there (not
 *  under public/) specifically so this always reads the current file off
 *  disk per request — Next enumerates public/ into a build-time manifest,
 *  so a file written after the last build would otherwise 404 forever
 *  (and that 404 gets cached). See src/lib/uploads.ts. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Every segment must be a plain name — reject any ".." or nested
  // separator outright rather than trying to resolve-then-check.
  if (segments.length === 0 || segments.some((segment) => segment.includes("..") || segment.includes("/"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const extension = path.extname(segments[segments.length - 1]).toLowerCase();
  const contentType = MIME_TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(UPLOADS_ROOT, ...segments);

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) throw new Error("not a file");

    const buffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stats.size),
        // Safe to cache hard: saveUploadedPhoto always mints a fresh
        // UUID filename, so a given URL is never reused for new content.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
