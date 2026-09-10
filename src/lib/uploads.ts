import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Deliberately NOT under public/: Next.js enumerates public/ into a
// build-time static-files manifest (see outputs.staticFiles), so a file
// written here after the last build is invisible to Next's static-asset
// serving and falls through to a (cached!) 404 page. Serving instead goes
// through the route handler at src/app/uploads/[...path]/route.ts, which
// reads this directory fresh on every request.
export const UPLOADS_ROOT = path.join(process.cwd(), process.env.UPLOADS_DIR || "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Validates and writes an uploaded image under UPLOADS_ROOT, returning the
 *  root-relative URL to store (e.g. "/uploads/coaches/<uuid>.jpg"). The
 *  browser-supplied filename is never used — this sidesteps path-traversal
 *  and collision concerns entirely. */
export async function saveUploadedPhoto(
  file: File,
  subfolder: "coaches" | "players" | "clubs" | "articles",
): Promise<string> {
  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  if (!extension) {
    throw new Error("Attēlam jābūt JPEG, PNG vai WebP formātā.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Attēls nedrīkst pārsniegt 5 MB.");
  }

  const filename = `${crypto.randomUUID()}${extension}`;
  const dir = path.join(UPLOADS_ROOT, subfolder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subfolder}/${filename}`;
}

/** Deletes a previously-uploaded photo from disk. No-ops for null, for a
 *  URL that isn't one of ours to manage (e.g. a seeded build-time asset
 *  path like "/coach-portrait.png"), and for a file that's already gone. */
export async function deleteUploadedPhoto(photoUrl: string | null): Promise<void> {
  if (!photoUrl || !photoUrl.startsWith("/uploads/")) return;

  const relativePath = photoUrl.slice("/uploads/".length);
  const filePath = path.join(UPLOADS_ROOT, relativePath);

  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
