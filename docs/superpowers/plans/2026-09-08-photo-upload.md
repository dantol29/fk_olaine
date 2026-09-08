# Coach & Player Photo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain "paste a URL" photo fields on Coach and Player admin forms with a real file upload that survives cPanel redeploys.

**Architecture:** A shared `src/lib/uploads.ts` module validates and writes uploaded image files under an `UPLOADS_DIR` folder (env-configurable; defaults to `public/uploads` locally, points at a folder inside `public_html/` in cPanel production), returning a root-relative URL to store in the existing `photoUrl` columns. The Player and Coach admin forms swap their text input for a file picker, a thumbnail of the current photo, and a "remove photo" checkbox; their Server Actions call the shared helper to save/delete files alongside the existing DB writes.

**Tech Stack:** Node's `fs/promises` (file I/O), Web Crypto `crypto.randomUUID()` (already used elsewhere in this codebase for HMAC in `src/lib/auth.ts`), Next.js Server Actions (existing pattern throughout the admin).

**Spec:** `docs/superpowers/specs/2026-09-08-photo-upload-design.md`

## Global Constraints

- Team/club logos for games are out of scope — separate future spec.
- No "paste a URL" fallback — upload-only, per the approved spec.
- Allowed image types: `image/jpeg`, `image/png`, `image/webp`. Max size: 5MB.
- `photoUrl` is always stored as a root-relative URL (`/uploads/<subfolder>/<filename>`), never a full domain.
- A stored `photoUrl` that does **not** start with `/uploads/` (e.g. the seeded coaches' `/coach-portrait.png`, a build-time bundled asset) must never be deleted by the cleanup logic — it isn't a file this system manages.

---

### Task 1: Shared upload helper and environment configuration

**Files:**
- Create: `src/lib/uploads.ts`
- Modify: `.env`
- Modify: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `saveUploadedPhoto(file: File, subfolder: "coaches" | "players"): Promise<string>` and `deleteUploadedPhoto(photoUrl: string | null): Promise<void>`, both consumed by Tasks 2 and 3.

- [ ] **Step 1: Write the upload helper**

Create `src/lib/uploads.ts`:

```ts
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
```

- [ ] **Step 2: Add the env var**

In `.env`, add after the `ADMIN_PASSWORD` line:

```
# Where uploaded photos are written. Locally this is inside the app's own
# public/ folder so Next's dev server serves it automatically. In cPanel
# production, point this at an absolute path inside public_html/ (created
# once via File Manager) so Apache serves uploads directly.
UPLOADS_DIR=public/uploads
```

Make the identical addition to `.env.example`.

- [ ] **Step 3: Gitignore local dev uploads**

In `.gitignore`, add after the `local.db-*` line:

```

# locally-uploaded photos (admin backoffice dev)
/public/uploads/
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run this script to exercise the helper directly against the real filesystem:

```bash
npx tsx -e "
import { saveUploadedPhoto, deleteUploadedPhoto } from './src/lib/uploads';
import { readFile, access } from 'node:fs/promises';

async function main() {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // fake PNG bytes, enough for this test
  const file = new File([bytes], 'test.png', { type: 'image/png' });

  const url = await saveUploadedPhoto(file, 'coaches');
  console.log('saved at URL:', url);
  if (!url.startsWith('/uploads/coaches/') || !url.endsWith('.png')) {
    throw new Error('unexpected URL shape: ' + url);
  }

  const diskPath = 'public' + url;
  await access(diskPath); // throws if missing
  console.log('file exists on disk:', diskPath);

  await deleteUploadedPhoto(url);
  try {
    await access(diskPath);
    throw new Error('file should have been deleted');
  } catch (e) {
    console.log('file correctly deleted after cleanup');
  }

  // A legacy/bundled asset path must never be touched.
  await deleteUploadedPhoto('/coach-portrait.png');
  await access('public/coach-portrait.png');
  console.log('legacy asset path correctly left untouched');

  // Oversized/wrong-type rejection.
  const tooBig = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
  try {
    await saveUploadedPhoto(tooBig, 'coaches');
    throw new Error('should have rejected oversized file');
  } catch (e) {
    console.log('correctly rejected oversized file:', (e as Error).message);
  }

  try {
    await saveUploadedPhoto(new File([bytes], 'test.gif', { type: 'image/gif' }), 'coaches');
    throw new Error('should have rejected gif');
  } catch (e) {
    console.log('correctly rejected non-allowed type:', (e as Error).message);
  }
}

main();
"
```

Expected output: saved URL matches `/uploads/coaches/<uuid>.png`, file exists on disk, gets deleted, the legacy `/coach-portrait.png` path is left alone, and both the oversized file and the disallowed `.gif` type are rejected with the expected Latvian error messages.

- [ ] **Step 5: Commit**

```bash
git add src/lib/uploads.ts .env .env.example .gitignore
git commit -m "feat: add shared photo upload helper and UPLOADS_DIR config"
```

---

### Task 2: Wire photo upload into the Players admin form

**Files:**
- Modify: `src/app/admin/(protected)/players/actions.ts`
- Modify: `src/app/admin/(protected)/players/[id]/player-form.tsx`

**Interfaces:**
- Consumes: `saveUploadedPhoto`, `deleteUploadedPhoto` (Task 1).

- [ ] **Step 1: Update the Server Actions**

Replace the full contents of `src/app/admin/(protected)/players/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { players } from "@/db/schema";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function parsePlayerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthdate = String(formData.get("birthdate") ?? "").trim();
  const teamId = Number(formData.get("teamId"));

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!birthdate) return { error: "Dzimšanas datums ir obligāts." } as const;
  if (!teamId) return { error: "Jāizvēlas komanda." } as const;

  return { name, birthdate, teamId } as const;
}

export async function createPlayer(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photo, "players");
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  await db.insert(players).values({ ...parsed, photoUrl, createdAt: Date.now() });
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
  redirect("/admin/players");
}

export async function updatePlayer(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "on";
  const updates: { name: string; birthdate: string; teamId: number; photoUrl?: string | null } = {
    ...parsed,
  };

  if (photo instanceof File && photo.size > 0) {
    let newPhotoUrl: string;
    try {
      newPhotoUrl = await saveUploadedPhoto(photo, "players");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ photoUrl: players.photoUrl })
      .from(players)
      .where(eq(players.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = newPhotoUrl;
  } else if (removePhoto) {
    const [existing] = await db
      .select({ photoUrl: players.photoUrl })
      .from(players)
      .where(eq(players.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = null;
  }

  await db.update(players).set(updates).where(eq(players.id, id));
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
  redirect("/admin/players");
}

export async function deletePlayer(id: number) {
  const [existing] = await db
    .select({ photoUrl: players.photoUrl })
    .from(players)
    .where(eq(players.id, id));
  await deleteUploadedPhoto(existing?.photoUrl ?? null);

  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
}
```

(Leaving both the file input empty and the "remove" checkbox unchecked skips both branches, so `updates` has no `photoUrl` key at all — the column is left exactly as it was.)

- [ ] **Step 2: Update the form**

Replace the full contents of `src/app/admin/(protected)/players/[id]/player-form.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useActionState } from "react";

import { createPlayer, updatePlayer } from "../actions";

type Player = {
  id: number;
  name: string;
  birthdate: string;
  teamId: number;
  photoUrl: string | null;
};
type TeamOption = { id: number; name: string };

export function PlayerForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; player: Player; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createPlayer : updatePlayer.bind(null, props.player.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const player = props.mode === "edit" ? props.player : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns spēlētājs" : "Rediģēt spēlētāju"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Vārds, uzvārds
        <input
          type="text"
          name="name"
          required
          defaultValue={player?.name ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Dzimšanas datums (DD.MM.GGGG.)
        <input
          type="text"
          name="birthdate"
          placeholder="12.04.1998."
          required
          defaultValue={player?.birthdate ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={player?.teamId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="" disabled>
            Izvēlies komandu
          </option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Foto (nav obligāts)</span>
        {player?.photoUrl && (
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={80}
            height={80}
            className="mt-1.5 h-20 w-20 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
        {player?.photoUrl && (
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
            <input type="checkbox" name="removePhoto" />
            Noņemt foto
          </label>
        )}
      </div>

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With the dev server running and logged in, visit `/admin/players/new` and confirm the "Foto" field is now a file picker with no thumbnail or "Noņemt foto" checkbox (nothing to show/remove yet on create). Visit `/admin/players/<id>` for an existing player and confirm the file picker appears; if that player has no `photoUrl` yet, there's still no thumbnail/checkbox (nothing to show/remove).

Since these forms use `useActionState` (a client-side action-invocation path that isn't practical to reproduce with a raw HTTP client), verify the actual upload logic by calling the real action function directly, which exercises the exact same code the browser triggers:

```bash
npx tsx -e "
import { createPlayer } from './src/app/admin/(protected)/players/actions';
import { db } from './src/db/client';
import { teams } from './src/db/schema';

async function main() {
  const [team] = await db.select().from(teams).limit(1);
  if (!team) throw new Error('seed the DB first (npm run db:seed)');

  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  const file = new File([bytes], 'photo.png', { type: 'image/png' });

  const formData = new FormData();
  formData.set('name', 'Test Spēlētājs');
  formData.set('birthdate', '01.01.2015.');
  formData.set('teamId', String(team.id));
  formData.set('photo', file);

  try {
    await createPlayer(undefined, formData);
  } catch (e) {
    // redirect() throws internally outside a real request — expected here.
  }
}
main();
"
```

Then check what got written:

```bash
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./local.db' });
(async () => {
  const r = await client.execute(\"select id, name, photo_url from players where name = 'Test Spēlētājs'\");
  console.log(r.rows);
})();
"
```

Expected: one row, with `photo_url` matching `/uploads/players/<uuid>.png`, and that file actually present under `public/uploads/players/`.

Then verify the update path removes it correctly:

```bash
npx tsx -e "
import { updatePlayer } from './src/app/admin/(protected)/players/actions';
import { db } from './src/db/client';
import { players } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const [player] = await db.select().from(players).where(eq(players.name, 'Test Spēlētājs'));

  const formData = new FormData();
  formData.set('name', player.name);
  formData.set('birthdate', player.birthdate);
  formData.set('teamId', String(player.teamId));
  formData.set('removePhoto', 'on');

  try {
    await updatePlayer(player.id, undefined, formData);
  } catch (e) {
    // redirect() throws outside a real request — expected.
  }
}
main();
"
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./local.db' });
(async () => {
  const r = await client.execute(\"select photo_url from players where name = 'Test Spēlētājs'\");
  console.log(r.rows);
})();
"
```

Expected: `photo_url` is now `null`, and the previously-uploaded file under `public/uploads/players/` is gone.

Clean up the test row:

```bash
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./local.db' });
(async () => {
  await client.execute(\"delete from players where name = 'Test Spēlētājs'\");
  console.log('cleaned up');
})();
"
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/players/actions.ts" "src/app/admin/(protected)/players/[id]/player-form.tsx"
git commit -m "feat: wire photo upload into the players admin form"
```

---

### Task 3: Wire photo upload into the Coaches admin form

**Files:**
- Modify: `src/app/admin/(protected)/coaches/actions.ts`
- Modify: `src/app/admin/(protected)/coaches/[id]/coach-form.tsx`

**Interfaces:**
- Consumes: `saveUploadedPhoto`, `deleteUploadedPhoto` (Task 1).

- [ ] **Step 1: Update the Server Actions**

Replace the full contents of `src/app/admin/(protected)/coaches/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { coachTeams, coaches } from "@/db/schema";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

function parseCoachInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const license = String(formData.get("license") ?? "").trim();
  const authority = String(formData.get("authority") ?? "");
  const teamIds = formData.getAll("teamIds").map(Number).filter((n) => Number.isFinite(n));

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!position) return { error: "Amats ir obligāts." } as const;
  if (!license) return { error: "Licence ir obligāta." } as const;
  if (authority !== "UEFA" && authority !== "LFF") {
    return { error: "Jāizvēlas licences izdevējs." } as const;
  }

  return {
    name,
    position,
    license,
    authority: authority as "UEFA" | "LFF",
    teamIds,
  } as const;
}

async function syncCoachTeams(coachId: number, teamIds: number[]) {
  await db.delete(coachTeams).where(eq(coachTeams.coachId, coachId));
  if (teamIds.length > 0) {
    await db.insert(coachTeams).values(teamIds.map((teamId) => ({ coachId, teamId })));
  }
}

export async function createCoach(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseCoachInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photo, "coaches");
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  const { teamIds, ...coachFields } = parsed;
  const [inserted] = await db
    .insert(coaches)
    .values({ ...coachFields, photoUrl, createdAt: Date.now() })
    .returning({ id: coaches.id });
  await syncCoachTeams(inserted.id, teamIds);

  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
  redirect("/admin/coaches");
}

export async function updateCoach(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseCoachInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "on";

  const { teamIds, ...coachFields } = parsed;
  const updates: typeof coachFields & { photoUrl?: string | null } = { ...coachFields };

  if (photo instanceof File && photo.size > 0) {
    let newPhotoUrl: string;
    try {
      newPhotoUrl = await saveUploadedPhoto(photo, "coaches");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ photoUrl: coaches.photoUrl })
      .from(coaches)
      .where(eq(coaches.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = newPhotoUrl;
  } else if (removePhoto) {
    const [existing] = await db
      .select({ photoUrl: coaches.photoUrl })
      .from(coaches)
      .where(eq(coaches.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = null;
  }

  await db.update(coaches).set(updates).where(eq(coaches.id, id));
  await syncCoachTeams(id, teamIds);

  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
  redirect("/admin/coaches");
}

export async function deleteCoach(id: number) {
  const [existing] = await db
    .select({ photoUrl: coaches.photoUrl })
    .from(coaches)
    .where(eq(coaches.id, id));
  await deleteUploadedPhoto(existing?.photoUrl ?? null);

  await db.delete(coaches).where(eq(coaches.id, id));
  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
}
```

- [ ] **Step 2: Update the form**

In `src/app/admin/(protected)/coaches/[id]/coach-form.tsx`, replace the top of the file:

```tsx
"use client";

import { useActionState } from "react";

import { createCoach, updateCoach } from "../actions";
```

with:

```tsx
"use client";

import Image from "next/image";
import { useActionState } from "react";

import { createCoach, updateCoach } from "../actions";
```

Then replace the "Foto URL" block:

```tsx
      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Foto URL (nav obligāts)
        <input
          type="text"
          name="photoUrl"
          placeholder="/coach-portrait.png"
          defaultValue={coach?.photoUrl ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>
```

with:

```tsx
      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Foto (nav obligāts)</span>
        {coach?.photoUrl && (
          <Image
            src={coach.photoUrl}
            alt={coach.name}
            width={80}
            height={80}
            className="mt-1.5 h-20 w-20 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
        {coach?.photoUrl && (
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
            <input type="checkbox" name="removePhoto" />
            Noņemt foto
          </label>
        )}
      </div>
```

Everything else in the form (name, position, license, authority, teams checkboxes) is unchanged.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With the dev server running and logged in, visit `/admin/coaches/<id>` for one of the seeded coaches (all of which have `photoUrl: "/coach-portrait.png"`). Expected: the thumbnail shows the existing `/coach-portrait.png` image, the file picker appears, and a "Noņemt foto" checkbox is present. Do **not** check that box or actually submit the form for a seeded coach in this test — the seeded photo is a shared bundled asset, not something to delete via this flow (confirmed safe by `deleteUploadedPhoto`'s guard from Task 1, but avoid it anyway for a clean manual check).

Verify the actual action logic against a disposable coach, the same way as Task 2:

```bash
npx tsx -e "
import { createCoach } from './src/app/admin/(protected)/coaches/actions';
import { db } from './src/db/client';

async function main() {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  const file = new File([bytes], 'photo.png', { type: 'image/png' });

  const formData = new FormData();
  formData.set('name', 'Test Treneris');
  formData.set('position', 'Treneris');
  formData.set('license', 'UEFA C licence');
  formData.set('authority', 'UEFA');
  formData.set('photo', file);

  try {
    await createCoach(undefined, formData);
  } catch (e) {
    // redirect() throws outside a real request — expected.
  }
}
main();
"
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./local.db' });
(async () => {
  const r = await client.execute(\"select id, name, photo_url from coaches where name = 'Test Treneris'\");
  console.log(r.rows);
})();
"
```

Expected: one row with `photo_url` matching `/uploads/coaches/<uuid>.png`, file present on disk under `public/uploads/coaches/`.

Verify delete cleans up the file:

```bash
npx tsx -e "
import { deleteCoach } from './src/app/admin/(protected)/coaches/actions';
import { db } from './src/db/client';
import { coaches } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const [coach] = await db.select().from(coaches).where(eq(coaches.name, 'Test Treneris'));
  const photoUrl = coach.photoUrl;
  await deleteCoach(coach.id);
  console.log('deleted coach that had photo at', photoUrl);
}
main();
"
```

Then confirm the file at that path under `public/uploads/coaches/` no longer exists (`ls public/uploads/coaches/` and check).

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/coaches/actions.ts" "src/app/admin/(protected)/coaches/[id]/coach-form.tsx"
git commit -m "feat: wire photo upload into the coaches admin form"
```

---

## Post-plan note for deployment

Before deploying to cPanel: create an `uploads` folder once inside `public_html/` via cPanel File Manager (or SSH, if available), and set `UPLOADS_DIR` to its absolute path (e.g. `/home/<youruser>/public_html/uploads`) in the Node.js App's "Environment Variables" section, then restart the app. This is a one-time, manual setup step, the same category as the existing `npm run db:push`/`npm run db:seed` production bootstrapping already documented for this project.
