# Opponent Club Logos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin upload a logo for an opponent club by name, and show it everywhere that club's name currently renders with a logo-shaped slot (homepage widget, admin games list, calendar event popup) instead of the generated initials+color placeholder.

**Architecture:** A new `club_logos` table maps a club name to an uploaded logo. A single server-only resolver, `resolveClubLogos`, batches lookups and folds in the existing FK-Olaine-crest-priority rule, so every consumer just asks "what's the logo for this name" and gets back a URL or null. `initialsFor`/`colorFor` move from the server-only `games-server.ts` into the client-safe `games.ts` so the calendar's client component can use the same fallback rendering.

**Tech Stack:** Drizzle ORM + Turso/libSQL (existing), `src/lib/uploads.ts` (existing photo upload helper), Next.js Server Actions (existing pattern throughout the admin).

**Spec:** `docs/superpowers/specs/2026-09-08-club-logos-design.md`

## Global Constraints

- FK Olaine's own crest always takes priority over any admin-managed entry — `resolveClubLogos` checks `isOlaine` first.
- Exact name match only, no fuzzy matching.
- The calendar's compact weekly-grid cards stay plain text — only the expanded event popup gets the logo treatment.
- A `club_logos` entry always has a logo — the photo is required on create; there's no "remove logo, keep the entry" option (delete the whole entry instead).

---

### Task 1: Schema, shared helpers, and the logo resolver

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/lib/uploads.ts`
- Modify: `src/lib/games.ts`
- Create: `src/lib/club-logos.ts`

**Note:** `src/lib/games-server.ts` is intentionally left untouched here — its `initialsFor`/`colorFor`/`teamDisplay` still reference `isOlaine` directly and would stop compiling if this task removed that import (as originally drafted) without also rewriting `teamDisplay`. Task 3 already replaces this file's full contents, so the cleanup happens there in one atomic step instead of leaving a broken intermediate state. `games.ts` and `games-server.ts` will carry duplicate (differently-scoped: exported vs. local) copies of `initialsFor`/`colorFor` for the remainder of Task 1 and Task 2 — expected and resolved by Task 3.

**Interfaces:**
- Consumes: `db` (existing), `isOlaine` (existing, from `src/lib/games.ts`).
- Produces: `resolveClubLogos(names: string[]): Promise<Map<string, string | null>>` from `src/lib/club-logos.ts`, consumed by Tasks 2 (via the admin form doesn't need it, but Tasks 3, 4, 5 do), and `initialsFor(name: string): string` / `colorFor(name: string): string` exported from `src/lib/games.ts`, consumed by Task 3's `games-server.ts` and Task 4's `week-calendar.tsx`.

- [ ] **Step 1: Add the `club_logos` table**

In `src/db/schema.ts`, add after the `leagueSources` table definition:

```ts
export const clubLogos = sqliteTable("club_logos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url").notNull(),
  createdAt: integer("created_at").notNull(),
});
```

(No relations needed — this table isn't linked to `teams`, it's keyed purely by the free-text club name as it appears in `games.homeTeam`/`awayTeam`.)

- [ ] **Step 2: Widen the upload helper's subfolder type**

In `src/lib/uploads.ts`, change:

```ts
export async function saveUploadedPhoto(
  file: File,
  subfolder: "coaches" | "players",
): Promise<string> {
```

to:

```ts
export async function saveUploadedPhoto(
  file: File,
  subfolder: "coaches" | "players" | "clubs",
): Promise<string> {
```

- [ ] **Step 3: Move the initials/color helpers into the client-safe module**

Replace the full contents of `src/lib/games.ts`:

```ts
export type Team = {
  name: string;
  logo?: string;
  initials?: string;
  color?: string;
};

export type UpcomingGame = {
  day: string;
  month: string;
  year: string;
  weekday: string;
  time: string;
  home: Team;
  away: Team;
  venue: string;
  league: string;
};

export function isOlaine(name: string) {
  return /olaine/i.test(name);
}

export const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAI",
  "JŪN",
  "JŪL",
  "AUG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
];

export function gameDate(game: UpcomingGame): Date {
  const monthIndex = MONTHS.indexOf(game.month);
  const [hours, minutes] = game.time.split(":").map(Number);
  return new Date(
    Number(game.year),
    monthIndex >= 0 ? monthIndex : 0,
    Number(game.day),
    hours || 0,
    minutes || 0,
  );
}

const FALLBACK_TEAM_COLORS = [
  "bg-club-navy",
  "bg-club-red",
  "bg-[#167c4c]",
  "bg-[#1687c9]",
  "bg-[#7c3aed]",
];

/** Two-letter (or two-word-initial) fallback badge text for a club with no
 *  logo on file. */
export function initialsFor(name: string) {
  return name
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** A stable, deterministic Tailwind background color for a club's fallback
 *  initials badge, so the same name always gets the same color. */
export function colorFor(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % FALLBACK_TEAM_COLORS.length;
  }
  return FALLBACK_TEAM_COLORS[hash];
}
```

(This file has no `"server-only"` guard and no DB import — it's safe for both server and client code, which is exactly why `initialsFor`/`colorFor` belong here rather than in `games-server.ts`.)

- [ ] **Step 4: Write the logo resolver**

Create `src/lib/club-logos.ts`:

```ts
import "server-only";
import { inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";
import { isOlaine } from "@/lib/games";

const OLAINE_CREST = "/fk-olaine-crest-v2.png";

/** Resolves a batch of club names to their logo image — FK Olaine's own
 *  crest, an admin-managed opponent logo, or null if neither matches
 *  (callers render an initials+color placeholder for null). One batched
 *  query handles every non-Olaine name at once, so calling this with a
 *  whole list of games' home/away names is a single round trip. */
export async function resolveClubLogos(names: string[]): Promise<Map<string, string | null>> {
  const uniqueNames = [...new Set(names)];
  const nonOlaineNames = uniqueNames.filter((name) => !isOlaine(name));

  const rows =
    nonOlaineNames.length > 0
      ? await db.select().from(clubLogos).where(inArray(clubLogos.name, nonOlaineNames))
      : [];
  const logoByName = new Map(rows.map((row) => [row.name, row.logoUrl]));

  return new Map(
    uniqueNames.map((name) => [
      name,
      isOlaine(name) ? OLAINE_CREST : (logoByName.get(name) ?? null),
    ]),
  );
}
```

- [ ] **Step 5: Push the schema**

Run:
```bash
npm run db:push -- --force
```
Expected: `Changes applied` (adds the new `club_logos` table; every existing table is untouched since this step only adds a table).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

`resolveClubLogos` can't be exercised directly via a standalone `tsx` script here — `club-logos.ts` imports the `"server-only"` package, which throws unconditionally outside Next's own build pipeline (it's only aliased to a no-op by Next's webpack config; a plain Node/tsx run hits the real throwing implementation regardless of whether the calling code is actually server-only). This isn't a bug — it's the package doing exactly what it's for. Its actual behavior is verified live in Task 3, once it's wired into a real page the dev server renders.

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts src/lib/uploads.ts src/lib/games.ts src/lib/club-logos.ts
git commit -m "feat: add club_logos table, logo resolver, and shared team-badge helpers"
```

---

### Task 2: Admin club logos CRUD

**Files:**
- Create: `src/app/admin/(protected)/club-logos/actions.ts`
- Create: `src/app/admin/(protected)/club-logos/page.tsx`
- Create: `src/app/admin/(protected)/club-logos/[id]/page.tsx`
- Create: `src/app/admin/(protected)/club-logos/[id]/club-logo-form.tsx`
- Modify: `src/app/admin/(protected)/layout.tsx`

**Interfaces:**
- Consumes: `db`, `clubLogos` (Task 1); `saveUploadedPhoto`, `deleteUploadedPhoto` (existing, `src/lib/uploads.ts`); `DeleteButton` (existing).

- [ ] **Step 1: Write the Server Actions**

Create `src/app/admin/(protected)/club-logos/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

export async function createClubLogo(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nosaukums ir obligāts." };

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Logotips ir obligāts." };
  }

  let logoUrl: string;
  try {
    logoUrl = await saveUploadedPhoto(photo, "clubs");
  } catch (error) {
    return { error: (error as Error).message };
  }

  await db.insert(clubLogos).values({ name, logoUrl, createdAt: Date.now() });
  revalidatePath("/admin/club-logos");
  redirect("/admin/club-logos");
}

export async function updateClubLogo(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nosaukums ir obligāts." };

  const photo = formData.get("photo");
  const updates: { name: string; logoUrl?: string } = { name };

  if (photo instanceof File && photo.size > 0) {
    let newLogoUrl: string;
    try {
      newLogoUrl = await saveUploadedPhoto(photo, "clubs");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ logoUrl: clubLogos.logoUrl })
      .from(clubLogos)
      .where(eq(clubLogos.id, id));
    await deleteUploadedPhoto(existing?.logoUrl ?? null);
    updates.logoUrl = newLogoUrl;
  }

  await db.update(clubLogos).set(updates).where(eq(clubLogos.id, id));
  revalidatePath("/admin/club-logos");
  redirect("/admin/club-logos");
}

export async function deleteClubLogo(id: number) {
  const [existing] = await db
    .select({ logoUrl: clubLogos.logoUrl })
    .from(clubLogos)
    .where(eq(clubLogos.id, id));
  await deleteUploadedPhoto(existing?.logoUrl ?? null);

  await db.delete(clubLogos).where(eq(clubLogos.id, id));
  revalidatePath("/admin/club-logos");
}
```

- [ ] **Step 2: Write the list page**

Create `src/app/admin/(protected)/club-logos/page.tsx`:

```tsx
import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";

import { deleteClubLogo } from "./actions";

export default async function AdminClubLogosPage() {
  const rows = await db.select().from(clubLogos).orderBy(clubLogos.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Klubu logo</h1>
        <Link
          href="/admin/club-logos/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Vēl nav neviena kluba logo.
        </p>
      ) : (
        <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="p-4" />
              <th className="p-4 font-semibold">Nosaukums</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((club) => (
              <tr key={club.id} className="border-b border-slate-100 last:border-0">
                <td className="p-4">
                  <Image
                    src={club.logoUrl}
                    alt={club.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-contain"
                  />
                </td>
                <td className="p-4 font-semibold text-club-navy">{club.name}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/club-logos/${club.id}`}
                      aria-label={`Rediģēt klubu "${club.name}"`}
                      title="Rediģēt"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      action={deleteClubLogo.bind(null, club.id)}
                      confirmMessage={`Dzēst kluba "${club.name}" logo?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write the create/edit form**

Create `src/app/admin/(protected)/club-logos/[id]/club-logo-form.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useActionState } from "react";

import { createClubLogo, updateClubLogo } from "../actions";

type ClubLogo = { id: number; name: string; logoUrl: string };

export function ClubLogoForm(props: { mode: "create" } | { mode: "edit"; club: ClubLogo }) {
  const action =
    props.mode === "create" ? createClubLogo : updateClubLogo.bind(null, props.club.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const club = props.mode === "edit" ? props.club : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns kluba logo" : "Rediģēt kluba logo"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Nosaukums
        <input
          type="text"
          name="name"
          required
          placeholder="FK Ventspils"
          defaultValue={club?.name ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>
      <p className="mt-1.5 text-xs text-slate-400">
        Precīzi jāsakrīt ar kluba nosaukumu, kāds redzams spēlēs (Mājinieki / Viesi).
      </p>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Logotips</span>
        {club?.logoUrl && (
          <Image
            src={club.logoUrl}
            alt={club.name}
            width={80}
            height={80}
            className="mt-1.5 h-20 w-20 rounded-lg object-contain"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          required={props.mode === "create"}
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
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

Create `src/app/admin/(protected)/club-logos/[id]/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { clubLogos } from "@/db/schema";

import { ClubLogoForm } from "./club-logo-form";

export default async function AdminClubLogoFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return <ClubLogoForm mode="create" />;
  }

  const clubId = Number(id);
  const [club] = await db.select().from(clubLogos).where(eq(clubLogos.id, clubId));
  if (!club) notFound();

  return <ClubLogoForm mode="edit" club={club} />;
}
```

- [ ] **Step 4: Add the nav item**

In `src/app/admin/(protected)/layout.tsx`, add a new entry to `NAV_ITEMS` right after `"Līgu avoti"`:

```ts
const NAV_ITEMS = [
  { href: "/admin/teams", label: "Komandas" },
  { href: "/admin/players", label: "Spēlētāji" },
  { href: "/admin/coaches", label: "Treneri" },
  { href: "/admin/trainings", label: "Treniņi" },
  { href: "/admin/events", label: "Notikumi" },
  { href: "/admin/games", label: "Spēles" },
  { href: "/admin/league-sources", label: "Līgu avoti" },
  { href: "/admin/club-logos", label: "Klubu logo" },
];
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With the dev server running and logged in, visit `/admin/club-logos/new`: try submitting with no file selected, confirm the "Logotips ir obligāts." error shows. Then create an entry named "FK Ventspils" with an uploaded image. Confirm it appears in the list with its thumbnail. Edit it (upload a different image), confirm the thumbnail updates and the old file is gone from `public/uploads/clubs/`. Delete it, confirm both the row and the file are gone.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(protected)/club-logos" "src/app/admin/(protected)/layout.tsx"
git commit -m "feat: add club logos admin CRUD"
```

---

### Task 3: Wire logos into the homepage/article "next match" widget

**Files:**
- Modify: `src/lib/games-server.ts`

**Interfaces:**
- Consumes: `resolveClubLogos` (Task 1).

- [ ] **Step 1: Update `getUpcomingGamesFromDb`**

Replace the full contents of `src/lib/games-server.ts`:

```ts
import "server-only";
import { gte } from "drizzle-orm";

import { db } from "@/db/client";
import { games as gamesTable } from "@/db/schema";
import { toDateKey } from "@/lib/calendar";
import { resolveClubLogos } from "@/lib/club-logos";
import { colorFor, initialsFor, MONTHS, type Team, type UpcomingGame } from "@/lib/games";

function teamDisplay(name: string, logo: string | null): Team {
  return logo ? { name, logo } : { name, initials: initialsFor(name), color: colorFor(name) };
}

const WEEKDAY_ABBR: Record<string, string> = {
  pirmdiena: "PIRMD.",
  otrdiena: "OTRD.",
  trešdiena: "TREŠD.",
  ceturtdiena: "CETURTD.",
  piektdiena: "PIEKTD.",
  sestdiena: "SESTD.",
  svētdiena: "SVĒTD.",
};

function weekdayAbbrFor(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    weekday: "long",
  })
    .format(noonUtc)
    .toLowerCase();
  return WEEKDAY_ABBR[weekday] ?? "";
}

/** The club's own upcoming games, pulled straight from the `games` DB table.
 *  Shared by the homepage showcase and the article "Nākamā spēle" widget so
 *  both stay in sync with the same real data. Server-only: never import this
 *  from a "use client" component — it touches the DB client. */
export async function getUpcomingGamesFromDb(
  limit: number,
): Promise<UpcomingGame[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select()
      .from(gamesTable)
      .where(gte(gamesTable.date, todayKey))
      .orderBy(gamesTable.date, gamesTable.startTime)
      .limit(limit);

    const logos = await resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam]));

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      return {
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        weekday: weekdayAbbrFor(row.date),
        time: row.startTime,
        league: row.league ?? "Draudzības spēle",
        home: teamDisplay(row.homeTeam, logos.get(row.homeTeam) ?? null),
        away: teamDisplay(row.awayTeam, logos.get(row.awayTeam) ?? null),
        venue: row.location,
      };
    });
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Insert a test game for an opponent that has a `club_logos` entry (create one via `/admin/club-logos` if you haven't already, matching the exact name you'll use here):

```bash
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./local.db' });
(async () => {
  const teams = await client.execute(\"select id from teams limit 1\");
  const teamId = teams.rows[0].id;
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await client.execute({
    sql: 'insert into games (team_id, home_team, away_team, date, start_time, end_time, location, source, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [teamId, 'FK Olaine', 'FK Ventspils', future, '18:00', '19:30', 'Olaines pilsētas stadions', 'manual', Date.now()],
  });
  console.log('inserted test game for', future);
})();
"
```

With the dev server running, visit `/` and confirm the "next match" widget shows FK Ventspils' uploaded logo instead of an "FV" initials badge (FK Olaine's side still shows the crest). Then clean up:

```bash
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./local.db' });
(async () => {
  await client.execute(\"delete from games where away_team = 'FK Ventspils'\");
  console.log('cleaned up');
})();
"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/games-server.ts
git commit -m "feat: show opponent club logos in the homepage next-match widget"
```

---

### Task 4: Wire logos into the calendar event popup

**Files:**
- Modify: `src/lib/calendar.ts`
- Modify: `src/components/week-calendar.tsx`

**Interfaces:**
- Consumes: `resolveClubLogos` (Task 1); `initialsFor`, `colorFor` (Task 1, from `src/lib/games.ts`).

- [ ] **Step 1: Add the new fields to `CalendarEvent` and populate them**

In `src/lib/calendar.ts`, add the import:

```ts
import { resolveClubLogos } from "@/lib/club-logos";
```

Update the `CalendarEvent` type — add after the existing `team: string | null;` line:

```ts
  /** Only set for eventType "game" — the two sides' names and resolved
   *  logo images (or null if no logo is on file for that side). */
  homeTeam?: string;
  awayTeam?: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
```

Replace the `getAdminGameEvents` function:

```ts
async function getAdminGameEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: games.id,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      date: games.date,
      startTime: games.startTime,
      endTime: games.endTime,
      location: games.location,
      teamName: teams.name,
    })
    .from(games)
    .innerJoin(teams, eq(games.teamId, teams.id))
    .where(and(gte(games.date, afterKey), lte(games.date, beforeKey)));

  const logos = await resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam]));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const start = rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime));
    const end = rigaWallClockToUtc(year, month, day, ...timeToParts(row.endTime));

    return {
      uid: `game-${row.id}`,
      title: `${row.homeTeam} – ${row.awayTeam}`,
      location: row.location,
      allDay: false,
      start,
      end,
      eventType: "game",
      team: row.teamName,
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      homeLogo: logos.get(row.homeTeam) ?? null,
      awayLogo: logos.get(row.awayTeam) ?? null,
      ...formatLabels(start, false),
    };
  });
}
```

- [ ] **Step 2: Add a mini team badge to the popup**

In `src/components/week-calendar.tsx`, update the import line:

```ts
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar";
```

to:

```ts
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar";
import { colorFor, initialsFor } from "@/lib/games";
```

Add a new component right after the `EventCard` function (before `type WeekCalendarProps`):

```tsx
function TeamBadgeMini({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
      {logo ? (
        <Image src={logo} alt={name} width={40} height={40} className="h-10 w-10 object-contain" />
      ) : (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-extrabold text-white",
            colorFor(name),
          )}
        >
          {initialsFor(name)}
        </div>
      )}
      <span className="line-clamp-2 text-[11px] leading-tight text-club-navy">{name}</span>
    </div>
  );
}
```

Replace the plain title in the popup:

```tsx
            <h3 className="mt-3 text-lg font-bold text-club-navy">
              {selectedEvent.title}
            </h3>
```

with:

```tsx
            {selectedEvent.eventType === "game" &&
            selectedEvent.homeTeam &&
            selectedEvent.awayTeam ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <TeamBadgeMini name={selectedEvent.homeTeam} logo={selectedEvent.homeLogo ?? null} />
                <span className="shrink-0 text-xs font-extrabold text-slate-300">VS</span>
                <TeamBadgeMini name={selectedEvent.awayTeam} logo={selectedEvent.awayLogo ?? null} />
              </div>
            ) : (
              <h3 className="mt-3 text-lg font-bold text-club-navy">{selectedEvent.title}</h3>
            )}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Using the same test game insert from Task 3 Step 2 (re-insert it if you already cleaned it up), visit `/` and open the calendar section, find that game's card in the weekly grid (still shows plain text, unchanged), click it. Expected: the popup shows FK Olaine's crest, a "VS" divider, and FK Ventspils' uploaded logo — not the plain "FK Olaine – FK Ventspils" title. Click a training or "other" event and confirm its popup still shows the plain title as before (unaffected).

Clean up the test game the same way as Task 3 Step 2.

- [ ] **Step 4: Commit**

```bash
git add src/lib/calendar.ts src/components/week-calendar.tsx
git commit -m "feat: show opponent club logos in the calendar event popup"
```

---

### Task 5: Wire logos into the admin games list

**Files:**
- Modify: `src/app/admin/(protected)/games/page.tsx`

**Interfaces:**
- Consumes: `resolveClubLogos` (Task 1); `initialsFor`, `colorFor` (Task 1, from `src/lib/games.ts`).

- [ ] **Step 1: Update the list page**

Replace the full contents of `src/app/admin/(protected)/games/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { games, teams } from "@/db/schema";
import { resolveClubLogos } from "@/lib/club-logos";
import { colorFor, initialsFor } from "@/lib/games";
import { cn } from "@/lib/utils";

import { deleteGame } from "./actions";

function ClubBadge({ name, logo }: { name: string; logo: string | null }) {
  return (
    <span className="flex items-center gap-2">
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 rounded-full object-contain"
        />
      ) : (
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-extrabold text-white",
            colorFor(name),
          )}
        >
          {initialsFor(name)}
        </span>
      )}
      {name}
    </span>
  );
}

export default async function AdminGamesPage() {
  const rows = await db
    .select({
      id: games.id,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      date: games.date,
      startTime: games.startTime,
      endTime: games.endTime,
      location: games.location,
      league: games.league,
      teamName: teams.name,
    })
    .from(games)
    .innerJoin(teams, eq(games.teamId, teams.id))
    .orderBy(games.date);

  const logos = await resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Spēles</h1>
        <Link
          href="/admin/games/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4 font-semibold">Mājinieki</th>
            <th className="p-4 font-semibold">Viesi</th>
            <th className="p-4 font-semibold">Sacensības</th>
            <th className="p-4 font-semibold">Vieta</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((game) => (
            <tr key={game.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-club-navy">{game.date}</td>
              <td className="p-4 text-slate-500">
                {game.startTime}–{game.endTime}
              </td>
              <td className="p-4 font-semibold text-club-navy">{game.teamName}</td>
              <td className="p-4 text-slate-500">
                <ClubBadge name={game.homeTeam} logo={logos.get(game.homeTeam) ?? null} />
              </td>
              <td className="p-4 text-slate-500">
                <ClubBadge name={game.awayTeam} logo={logos.get(game.awayTeam) ?? null} />
              </td>
              <td className="p-4 text-slate-500">{game.league ?? "Draudzības spēle"}</td>
              <td className="p-4 text-slate-500">{game.location}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/games/${game.id}`}
                    aria-label={`Rediģēt spēli "${game.homeTeam} – ${game.awayTeam}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteGame.bind(null, game.id)}
                    confirmMessage={`Dzēst spēli "${game.homeTeam} – ${game.awayTeam}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-slate-400">
                Vēl nav nevienas spēles.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Re-insert the Task 3 Step 2 test game (FK Olaine vs FK Ventspils). Visit `/admin/games`. Expected: FK Olaine's row shows the crest next to its name, FK Ventspils shows its uploaded logo, and any other game's opponent with no matching `club_logos` entry shows the initials+color badge as before. Clean up the test game afterward.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(protected)/games/page.tsx"
git commit -m "feat: show opponent club logos in the admin games list"
```
