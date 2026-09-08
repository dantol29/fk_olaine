import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "public/uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Validates and writes an uploaded image under UPLOADS_DIR, returning the
 *  root-relative URL to store (e.g. "/uploads/coaches/<uuid>.jpg"). The
 *  browser-supplied filename is never used — this sidesteps path-traversal
 *  and collision concerns entirely. */
export async function saveUploadedPhoto(
  file: File,
  subfolder: "coaches" | "players",
): Promise<string> {
  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  if (!extension) {
    throw new Error("Attēlam jābūt JPEG, PNG vai WebP formātā.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Attēls nedrīkst pārsniegt 5 MB.");
  }

  const filename = `${crypto.randomUUID()}${extension}`;
  const dir = path.join(UPLOADS_DIR, subfolder);
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
  const filePath = path.join(UPLOADS_DIR, relativePath);

  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
