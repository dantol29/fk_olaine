# Coach & Player Photo Upload — Design

**Status:** Approved by user, 2026-09-08.

## Motivation

Coach and Player `photoUrl` fields are currently plain text inputs — the admin has to already have an image hosted somewhere and paste its URL in by hand. The site will be deployed on cPanel (via cPanel's "Setup Node.js App" / Phusion Passenger feature, running `next start` as a persistent Node process — not a static export, since the app has Server Actions, database access, and auth-gated dynamic routes). This design replaces the manual-URL fields with a real file picker that uploads an image and stores it, in a way that survives cPanel redeploys.

**Team/club logos for games are explicitly out of scope for this spec.** They need their own concept (a club-name → logo mapping, since `games.homeTeam`/`awayTeam` are free-text names, not linked to any existing entity) and will be brainstormed as a separate follow-up spec once this one ships — reusing the upload helper this spec builds.

## Storage and serving

cPanel's Node.js App feature deploys the app to its own folder, separate from the account's `public_html/` web root, and that folder is replaced on every redeploy — nothing written there persists. The standard pattern on cPanel (the same one WordPress uses for `wp-content/uploads`, Laravel for its `storage/` folder, etc.) is to write uploads into a folder that lives inside the account's public web root instead, so the web server serves them directly without touching the Node process at all.

- A new env var, `UPLOADS_DIR`, holds the absolute filesystem path uploads get written to.
  - **Local dev default:** `public/uploads` — Next's dev server already serves anything under `public/` automatically, so nothing extra needs configuring locally.
  - **Production (cPanel):** set to something like `/home/<cpanel-user>/public_html/uploads` in the Node.js App's environment variables screen, after creating that folder once via cPanel File Manager (subfolders like `coaches/`/`players/` are created on demand by the upload code itself via a recursive `mkdir`, so nothing more than the top-level folder needs to exist upfront).
- The DB's `photoUrl` column always stores a **root-relative URL** (e.g. `/uploads/coaches/8f2a1c3d4e.jpg`), never a full domain. The same stored value resolves correctly whether Next's dev server is serving it (`public/uploads/...`) or Apache/LiteSpeed is serving it directly in production (`public_html/uploads/...`) — no per-environment URL logic needed anywhere else in the app.

## Upload flow

A new shared module, `src/lib/uploads.ts`, used by both Player and Coach actions:

```ts
export async function saveUploadedPhoto(
  file: File,
  subfolder: "coaches" | "players",
): Promise<string> // returns the root-relative URL, e.g. "/uploads/coaches/<uuid>.jpg"

export async function deleteUploadedPhoto(photoUrl: string | null): Promise<void>
```

`saveUploadedPhoto`:
1. Validates `file.type` is one of `image/jpeg`, `image/png`, `image/webp` — anything else is rejected.
2. Validates `file.size` is at most 5MB (`5 * 1024 * 1024` bytes) — anything larger is rejected.
3. Generates a random filename via `crypto.randomUUID()` plus an extension mapped from the validated MIME type (`image/jpeg` → `.jpg`, `image/png` → `.png`, `image/webp` → `.webp`) — the browser-supplied filename is never used, avoiding path-traversal and collision concerns entirely.
4. Creates `UPLOADS_DIR/<subfolder>/` if it doesn't exist yet (`fs.mkdir(..., { recursive: true })`) and writes the file's bytes there (`fs.writeFile`).
5. Returns the root-relative URL (`/uploads/<subfolder>/<filename>`) for the caller to store in `photoUrl`.

Both validation failures return a plain `Error` with a Latvian message, which the calling Server Action catches and returns as `{ error: "..." }` — the exact same shape every other form's validation errors already use in this codebase, so no new error-display UI is needed.

`deleteUploadedPhoto`:
1. No-ops if `photoUrl` is null.
2. Resolves the root-relative URL back to an absolute filesystem path under `UPLOADS_DIR` and deletes it (`fs.unlink`), swallowing an `ENOENT` (file already gone) rather than throwing — deletion is best-effort cleanup, never something that should block a save or a delete.

## Form changes

`src/app/admin/(protected)/players/[id]/player-form.tsx` and `.../coaches/[id]/coach-form.tsx`:

- The `<input type="text" name="photoUrl">` is replaced with `<input type="file" name="photo" accept="image/*">`.
- When editing an existing row that has a `photoUrl`, the current photo renders as a small thumbnail above the file input, so the admin can see what's currently set without having to open it elsewhere.
- A checkbox, "Noņemt foto" (remove photo), lets the admin clear the photo without uploading a replacement.
- Leaving the file input empty and the checkbox unchecked keeps the existing photo untouched — editing a player's birthdate, for instance, doesn't require re-uploading their photo.

## Server Action changes

`createPlayer`/`updatePlayer` (`players/actions.ts`) and `createCoach`/`updateCoach` (`coaches/actions.ts`):

1. Read the `photo` file and the `removePhoto` checkbox from `FormData`.
2. If a file was provided (`file.size > 0`): call `saveUploadedPhoto`; on update, also call `deleteUploadedPhoto` on the row's *previous* `photoUrl` first (read via a `SELECT` before the update, since the new value will overwrite the column). Use the new URL for `photoUrl`.
3. Else if "remove" was checked: on update, call `deleteUploadedPhoto` on the previous `photoUrl`; set `photoUrl` to `null`.
4. Else: don't touch `photoUrl` at all — for `updatePlayer`/`updateCoach`, this means excluding the field from the `.set()` call entirely rather than setting it to its own current value, so a validation failure elsewhere in the form can't accidentally wipe it.
5. If `saveUploadedPhoto` throws (validation failure), return `{ error: error.message }` exactly like every other validation branch in these actions, before any DB write happens.

`deleteCoach`/`deletePlayer`: before deleting the row, `SELECT` its `photoUrl` and call `deleteUploadedPhoto` on it — otherwise that file would be orphaned on disk with nothing left in the database ever pointing at it again. This follows directly from the "clean up old files" decision; it wasn't explicitly asked for but is the only consistent behavior once replacing a photo already deletes the old one.

## Configuration

- `.env` / `.env.example` gain `UPLOADS_DIR=public/uploads` (mirroring how `TURSO_DATABASE_URL` already defaults to a dev-friendly local value that production overrides).
- `.gitignore` gains `public/uploads/` — locally-uploaded test images during development shouldn't be committed, the same way `local.db` is already gitignored.

## Deployment note (cPanel)

Before uploads will work in production: create the `uploads` folder once inside `public_html/` via cPanel File Manager (or SSH, if available on the plan), and set `UPLOADS_DIR` to its absolute path in the Node.js App's "Environment Variables" section, then restart the app. This is a one-time, manual setup step — the same category as the existing `npm run db:push`/`npm run db:seed` production bootstrapping steps already documented for this project.

## Out of scope

- Team/club logos for games — separate follow-up spec, reusing `src/lib/uploads.ts`.
- Keeping a manual "paste a URL" fallback alongside the file picker — decided against; upload-only.
- Image resizing/compression/thumbnailing on upload — the original file is stored as-is. Can be added later if upload sizes become a real problem.
- Multiple photos per Player/Coach, or a photo gallery — one `photoUrl` per row, as today.
