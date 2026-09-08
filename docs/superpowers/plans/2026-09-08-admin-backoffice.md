# FK Olaine Admin Backoffice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give FK Olaine a password-protected `/admin` area backed by a real database, so an admin can manage Teams, Players, Coaches, Trainings, Events, and Games — and wire the public `/komandas`, `/treneri`, and homepage-calendar pages to read that data instead of hardcoded arrays.

**Architecture:** Next.js App Router Server Components read directly from a Turso (libSQL) database via Drizzle ORM; Server Actions handle all mutations and call `revalidatePath` so both admin and public pages refresh. A single shared admin password sets an HMAC-signed, HTTP-only session cookie (Web Crypto, not Node's `crypto` module, so it works identically wherever `proxy.ts` runs); `src/proxy.ts` guards every `/admin/*` route except `/admin/login`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM (`drizzle-orm/libsql`), `@libsql/client`, Turso (production) / local SQLite file (dev), Tailwind v4 (existing tokens), React 19 `useActionState`.

**Spec:** `docs/superpowers/specs/2026-09-06-admin-backoffice-design.md`

## Global Constraints

- **Next.js 16 breaking changes** (confirmed in `node_modules/next/dist/docs/`, not from memory):
  - `middleware.ts` is deprecated → use `src/proxy.ts` exporting a function named `proxy`, plus `export const config = { matcher: [...] }`.
  - `cookies()` from `next/headers` is **async** — always `await cookies()`.
  - Dynamic route `params` are **async** — pages receive `params: Promise<{ id: string }>` and must `await params` (or `use(params)` in a Client Component).
- **No new UI library.** No shadcn `Input`/`Select`/`Table`/`Checkbox` — this codebase already builds all its forms and tables with plain HTML elements + Tailwind utility classes using the existing tokens (`text-club-navy`, `bg-club-red`, `border-slate-200`, etc.). The admin follows the same convention.
- **Auth uses Web Crypto (`crypto.subtle`), never Node's `crypto` module** — `src/proxy.ts` may run outside the Node runtime, and `src/lib/auth.ts` is shared between it and Server Actions, so it must work in both.
- **One shared admin password** (`ADMIN_PASSWORD` env var) — no per-user accounts, no roles.
- **Local dev needs no external account.** `@libsql/client` talks to a plain local file via `file:./local.db` when `TURSO_DATABASE_URL` is unset — only production needs a real Turso database.
- **Every Server Action validates its own input** (required fields, numeric IDs) and returns `{ error: string }` on failure rather than throwing — no validation library.
- **Non-goals (do not build):** multi-user accounts/roles, image upload pipeline (photo fields are plain URL text inputs), recurring training schedules (every session is its own dated row — this plan deletes the recurring generator), admin management of league games/standings (stays scraped from lff.lv, untouched).

---

### Task 1: Install dependencies and set up local environment

**Files:**
- Modify: `package.json` (via `npm install`)
- Create: `.env.example`
- Create: `.env` (untracked — already covered by the repo's `.env*` gitignore rule)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `ADMIN_PASSWORD` env vars, read by every later task.
- Produces: `npm run db:push`, `npm run db:seed`, `npm run db:studio` scripts (added here, used in Tasks 2 and 12).

Using plain `.env` (not `.env.local`) is a deliberate choice: Next.js loads it automatically for the running app, and it's also the one filename `dotenv/config`'s default (no-argument) import loads — so `drizzle.config.ts` (Task 2) and `src/db/seed.ts` (Task 12), which run *outside* Next and need to load it explicitly, use that exact same default with no path argument to remember or get wrong.

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit tsx dotenv
```

- [ ] **Step 2: Create the local env file**

Create `.env`:

```
# Local dev only: a plain SQLite file, no Turso account needed.
TURSO_DATABASE_URL=file:./local.db
TURSO_AUTH_TOKEN=

# Any string works locally. Use a long random value in production.
SESSION_SECRET=dev-only-secret-change-me

# The single shared admin password.
ADMIN_PASSWORD=change-me
```

- [ ] **Step 3: Create the committed example file**

Create `.env.example` with the exact same content as Step 2 (it documents the required vars for whoever sets up production; it is safe to commit since these are dev-only placeholder values).

- [ ] **Step 4: Ignore the local SQLite file**

Append to `.gitignore` (after the existing `# env files` block):

```
# local sqlite db (admin backoffice dev)
local.db
local.db-*
```

- [ ] **Step 5: Add db scripts to package.json**

In `package.json`, add to `"scripts"`:

```json
"db:push": "drizzle-kit push",
"db:seed": "tsx src/db/seed.ts",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (nothing references the new packages yet, this just confirms the install didn't break anything).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "chore: add drizzle/libsql dependencies and local db env setup"
```

(`.env` itself is gitignored and must not be committed.)

---

### Task 2: Drizzle schema, client, and config

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/client.ts`
- Create: `drizzle.config.ts`

**Interfaces:**
- Consumes: env vars from Task 1.
- Produces: `db` (from `src/db/client.ts`) — a Drizzle instance with `.query.teams`, `.query.players`, `.query.coaches`, `.query.coachTeams`, `.select()/.insert()/.update()/.delete()` over every table. Every later task imports `{ db } from "@/db/client"`.
- Produces: tables `teams`, `players`, `coaches`, `coachTeams`, `trainings`, `events`, `games` from `src/db/schema.ts`, each with the exact columns listed below.

- [ ] **Step 1: Write the schema**

Create `src/db/schema.ts`:

```ts
import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  birthdate: text("birthdate").notNull(),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at").notNull(),
});

export const coaches = sqliteTable("coaches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  position: text("position").notNull(),
  license: text("license").notNull(),
  authority: text("authority", { enum: ["UEFA", "LFF"] }).notNull(),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at").notNull(),
});

export const coachTeams = sqliteTable(
  "coach_teams",
  {
    coachId: integer("coach_id")
      .notNull()
      .references(() => coaches.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.coachId, table.teamId] })],
);

export const trainings = sqliteTable("trainings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // "YYYY-MM-DD"
  startTime: text("start_time").notNull(), // "HH:MM"
  endTime: text("end_time"), // "HH:MM" | null
  location: text("location").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  opponent: text("opponent").notNull(),
  date: text("date").notNull(),
  time: text("time"),
  homeAway: text("home_away", { enum: ["home", "away"] }).notNull(),
  location: text("location"),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  coachTeams: many(coachTeams),
  trainings: many(trainings),
  events: many(events),
  games: many(games),
}));

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
}));

export const coachesRelations = relations(coaches, ({ many }) => ({
  coachTeams: many(coachTeams),
}));

export const coachTeamsRelations = relations(coachTeams, ({ one }) => ({
  coach: one(coaches, { fields: [coachTeams.coachId], references: [coaches.id] }),
  team: one(teams, { fields: [coachTeams.teamId], references: [teams.id] }),
}));
```

- [ ] **Step 2: Write the DB client**

Create `src/db/client.ts`:

```ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });
```

- [ ] **Step 3: Write the drizzle-kit config**

Create `drizzle.config.ts` (project root):

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  },
});
```

`dotenv/config` (a bare side-effect import, no path argument) loads `.env` from the current working directory by default — which is exactly the file Task 1 created, so `drizzle.config.ts` needs nothing further to pick it up.

- [ ] **Step 4: Push the schema to the local database**

Run: `npm run db:push`

Expected output: drizzle-kit lists the 7 tables (`teams`, `players`, `coaches`, `coach_teams`, `trainings`, `events`, `games`) as newly created, and a `local.db` file appears in the project root. Confirm with:

```bash
ls -la local.db
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/db drizzle.config.ts package.json package-lock.json
git commit -m "feat: add drizzle schema, db client, and push local sqlite db"
```

(`local.db` stays untracked per Task 1's `.gitignore` change.)

---

### Task 3: Session auth (Web Crypto) and the `/admin` proxy guard

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/proxy.ts`

**Interfaces:**
- Consumes: `SESSION_SECRET`, `ADMIN_PASSWORD` env vars.
- Produces: `SESSION_COOKIE_NAME: string`, `SESSION_MAX_AGE_SECONDS: number`, `createSessionToken(): Promise<string>`, `verifySessionToken(token: string | undefined): Promise<boolean>` from `src/lib/auth.ts` — used by Task 4's login/logout actions and by `src/proxy.ts`.

- [ ] **Step 1: Write the auth helpers**

Create `src/lib/auth.ts`:

```ts
export const SESSION_COOKIE_NAME = "fko_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padLength = (4 - (value.length % 4)) % 4;
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** A signed session token: "<expiryTimestampMs>.<base64url signature>". */
export async function createSessionToken(): Promise<string> {
  const key = await getSecretKey();
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${toBase64Url(signature)}`;
}

/** Verifies a session token's signature and that it hasn't expired. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const [payload, signatureB64] = token.split(".");
  if (!payload || !signatureB64) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  try {
    const key = await getSecretKey();
    const signature = fromBase64Url(signatureB64);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Write the proxy guard**

Create `src/proxy.ts`:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // Never guard the login page itself — checked by exact pathname rather
  // than folded into the matcher regex below, so this can't silently
  // regress into a redirect loop if the matcher syntax ever changes.
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(token);

  if (!isValid) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

`/admin/:path*` is the exact pattern shown in Next's own matcher docs (`config.matcher: ['/about/:path*', ...]`) — it matches `/admin` and every `/admin/...` path, including `/admin/login`, which is why the explicit pathname check above (not clever matcher exclusion) is what actually keeps the login page unguarded.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Start the dev server (`npm run dev`) and visit `http://localhost:3000/admin` in a browser.
Expected: redirected to `http://localhost:3000/admin/login` (which 404s until Task 4 — that 404, not a redirect loop or crash, confirms the guard is working).

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/proxy.ts
git commit -m "feat: add signed-cookie session auth and /admin proxy guard"
```

---

### Task 4: Login page, admin shell, logout, and root redirect

**Files:**
- Create: `src/app/admin/login/actions.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/(protected)/layout.tsx`
- Create: `src/app/admin/(protected)/page.tsx`

**Interfaces:**
- Consumes: `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_SECONDS`, `createSessionToken` from Task 3.
- Produces: `logout(): Promise<void>` Server Action from `src/app/admin/login/actions.ts`, imported by Task 4's own layout and reusable by nothing else (logout only appears in the admin shell).

The `(protected)` route group holds every authenticated admin page from here on — `/admin/login` sits outside it and gets no sidebar/logout chrome. Route groups don't add a URL segment, so `src/app/admin/(protected)/page.tsx` still serves `/admin`, and `src/app/admin/(protected)/teams/page.tsx` (Task 6) still serves `/admin/teams`.

- [ ] **Step 1: Write the login/logout Server Actions**

Create `src/app/admin/login/actions.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const password = String(formData.get("password") ?? "");

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { error: "Nepareiza parole." };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
```

- [ ] **Step 2: Write the login page**

Create `src/app/admin/login/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";

import { login } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-club-gray-light px-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-club-navy">FK Olaine admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ievadi administratora paroli, lai turpinātu.
        </p>

        <label className="mt-6 block text-sm font-semibold text-club-navy">
          Parole
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>

        {state?.error && (
          <p className="mt-3 text-sm font-semibold text-club-red">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-club-red py-2.5 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
        >
          {pending ? "Ielogojas..." : "Ielogoties"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Write the protected admin shell**

Create `src/app/admin/(protected)/layout.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

import { logout } from "@/app/admin/login/actions";

const NAV_ITEMS = [
  { href: "/admin/teams", label: "Komandas" },
  { href: "/admin/players", label: "Spēlētāji" },
  { href: "/admin/coaches", label: "Treneri" },
  { href: "/admin/trainings", label: "Treniņi" },
  { href: "/admin/events", label: "Notikumi" },
  { href: "/admin/games", label: "Spēles" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-club-gray-light">
      <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm font-extrabold text-club-navy uppercase">
            FK Olaine admin
          </p>
          <nav className="mt-6 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light"
          >
            Iziet
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Write the `/admin` root redirect**

Create `src/app/admin/(protected)/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function AdminRootPage() {
  redirect("/admin/teams");
}
```

(This 404s until Task 6 adds `/admin/teams` — that's expected for now.)

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With the dev server running, visit `/admin/login`, enter the `ADMIN_PASSWORD` from `.env` (`change-me`), submit.
Expected: redirected to `/admin`, which redirects to `/admin/teams` (404 for now, but the redirect chain and the sidebar are what we're confirming — check the URL bar ends on `/admin/teams` and a 404 page, not a login loop).

Click "Iziet" (once `/admin/teams` exists after Task 6) to confirm logout returns you to `/admin/login` and re-visiting `/admin` redirects to login again.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin
git commit -m "feat: add admin login page, protected shell layout, and logout"
```

---

### Task 5: Shared delete-confirm button

**Files:**
- Create: `src/components/admin/delete-button.tsx`

**Interfaces:**
- Produces: `DeleteButton({ action, confirmMessage }: { action: () => Promise<void>; confirmMessage: string })` — a Client Component used by every entity's list page (Tasks 6–11). `action` is a Server Action pre-bound to one row's id via `.bind(null, id)`.

- [ ] **Step 1: Write the component**

Create `src/components/admin/delete-button.tsx`:

```tsx
"use client";

export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm font-semibold text-club-red hover:underline">
        Dzēst
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (unused until Task 6 imports it — fine).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/delete-button.tsx
git commit -m "feat: add shared admin delete-confirm button"
```

---

### Task 6: Teams admin CRUD

**Files:**
- Create: `src/app/admin/(protected)/teams/actions.ts`
- Create: `src/app/admin/(protected)/teams/page.tsx`
- Create: `src/app/admin/(protected)/teams/[id]/page.tsx`
- Create: `src/app/admin/(protected)/teams/[id]/team-form.tsx`

**Interfaces:**
- Consumes: `db`, `teams` (Task 2); `DeleteButton` (Task 5).
- Produces: `createTeam`, `updateTeam(id: number, ...)`, `deleteTeam(id: number): Promise<void>` — the pattern every later entity's actions file repeats.

- [ ] **Step 1: Write the Server Actions**

Create `src/app/admin/(protected)/teams/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";

export async function createTeam(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nosaukums ir obligāts." };

  await db.insert(teams).values({ name, createdAt: Date.now() });
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
  redirect("/admin/teams");
}

export async function updateTeam(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nosaukums ir obligāts." };

  await db.update(teams).set({ name }).where(eq(teams.id, id));
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
  redirect("/admin/teams");
}

export async function deleteTeam(id: number) {
  await db.delete(teams).where(eq(teams.id, id));
  revalidatePath("/admin/teams");
  revalidatePath("/komandas");
}
```

- [ ] **Step 2: Write the list page**

Create `src/app/admin/(protected)/teams/page.tsx`:

```tsx
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { teams } from "@/db/schema";

import { deleteTeam } from "./actions";

export default async function AdminTeamsPage() {
  const rows = await db.select().from(teams).orderBy(teams.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Komandas</h1>
        <Link
          href="/admin/teams/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((team) => (
            <tr key={team.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{team.name}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/teams/${team.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
                  </Link>
                  <DeleteButton
                    action={deleteTeam.bind(null, team.id)}
                    confirmMessage={`Dzēst komandu "${team.name}"? Tiks dzēsti arī tās spēlētāji, treniņi, notikumi un spēles.`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="p-4 text-center text-slate-400">
                Vēl nav neviena komanda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Write the create/edit form**

Create `src/app/admin/(protected)/teams/[id]/team-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";

import { createTeam, updateTeam } from "../actions";

type Team = { id: number; name: string };

export function TeamForm(props: { mode: "create" } | { mode: "edit"; team: Team }) {
  const action = props.mode === "create" ? createTeam : updateTeam.bind(null, props.team.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauna komanda" : "Rediģēt komandu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Nosaukums
        <input
          type="text"
          name="name"
          required
          defaultValue={props.mode === "edit" ? props.team.name : ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

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

Create `src/app/admin/(protected)/teams/[id]/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";

import { TeamForm } from "./team-form";

export default async function AdminTeamFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return <TeamForm mode="create" />;
  }

  const teamId = Number(id);
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) notFound();

  return <TeamForm mode="edit" team={team} />;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With the dev server running and logged in, visit `/admin/teams`: create a team named "Test komanda", confirm it appears in the list, edit its name to "Test komanda 2", confirm the list updates, then delete it (confirm dialog appears; accepting removes it from the list).

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\(protected\)/teams
git commit -m "feat: add teams admin CRUD"
```

---

### Task 7: Players admin CRUD

**Files:**
- Create: `src/app/admin/(protected)/players/actions.ts`
- Create: `src/app/admin/(protected)/players/page.tsx`
- Create: `src/app/admin/(protected)/players/[id]/page.tsx`
- Create: `src/app/admin/(protected)/players/[id]/player-form.tsx`

**Interfaces:**
- Consumes: `db`, `players`, `teams` (Task 2); `DeleteButton` (Task 5).
- Produces: `createPlayer`, `updatePlayer(id: number, ...)`, `deletePlayer(id: number): Promise<void>`.

- [ ] **Step 1: Write the Server Actions**

Create `src/app/admin/(protected)/players/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { players } from "@/db/schema";

function parsePlayerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthdate = String(formData.get("birthdate") ?? "").trim();
  const teamId = Number(formData.get("teamId"));
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!birthdate) return { error: "Dzimšanas datums ir obligāts." } as const;
  if (!teamId) return { error: "Jāizvēlas komanda." } as const;

  return { name, birthdate, teamId, photoUrl: photoUrl || null } as const;
}

export async function createPlayer(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(players).values({ ...parsed, createdAt: Date.now() });
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

  await db.update(players).set(parsed).where(eq(players.id, id));
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
  redirect("/admin/players");
}

export async function deletePlayer(id: number) {
  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/admin/players");
  revalidatePath("/komandas");
}
```

- [ ] **Step 2: Write the list page**

Create `src/app/admin/(protected)/players/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { players, teams } from "@/db/schema";

import { deletePlayer } from "./actions";

export default async function AdminPlayersPage() {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      birthdate: players.birthdate,
      teamName: teams.name,
    })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .orderBy(teams.name, players.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Spēlētāji</h1>
        <Link
          href="/admin/players/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Vārds, uzvārds</th>
            <th className="p-4 font-semibold">Dzimšanas datums</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((player) => (
            <tr key={player.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{player.name}</td>
              <td className="p-4 text-slate-500">{player.birthdate}</td>
              <td className="p-4 text-slate-500">{player.teamName}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/players/${player.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
                  </Link>
                  <DeleteButton
                    action={deletePlayer.bind(null, player.id)}
                    confirmMessage={`Dzēst spēlētāju "${player.name}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-slate-400">
                Vēl nav neviena spēlētāja.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Write the create/edit form**

Create `src/app/admin/(protected)/players/[id]/player-form.tsx`:

```tsx
"use client";

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

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Foto URL (nav obligāts)
        <input
          type="text"
          name="photoUrl"
          placeholder="/coach-portrait.png"
          defaultValue={player?.photoUrl ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

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

Create `src/app/admin/(protected)/players/[id]/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { players, teams } from "@/db/schema";

import { PlayerForm } from "./player-form";

export default async function AdminPlayerFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <PlayerForm mode="create" teamOptions={teamOptions} />;
  }

  const playerId = Number(id);
  const [player] = await db.select().from(players).where(eq(players.id, playerId));
  if (!player) notFound();

  return <PlayerForm mode="edit" player={player} teamOptions={teamOptions} />;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With a team already created (from Task 6's verification, or create one now), visit `/admin/players/new`: create a player attached to that team, confirm it lists with the correct team name, edit it, then delete it.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\(protected\)/players
git commit -m "feat: add players admin CRUD"
```

---

### Task 8: Coaches admin CRUD (multi-team assignment)

**Files:**
- Create: `src/app/admin/(protected)/coaches/actions.ts`
- Create: `src/app/admin/(protected)/coaches/page.tsx`
- Create: `src/app/admin/(protected)/coaches/[id]/page.tsx`
- Create: `src/app/admin/(protected)/coaches/[id]/coach-form.tsx`

**Interfaces:**
- Consumes: `db`, `coaches`, `coachTeams`, `teams` (Task 2); `DeleteButton` (Task 5).
- Produces: `createCoach`, `updateCoach(id: number, ...)`, `deleteCoach(id: number): Promise<void>`.

- [ ] **Step 1: Write the Server Actions**

Create `src/app/admin/(protected)/coaches/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { coachTeams, coaches } from "@/db/schema";

function parseCoachInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const license = String(formData.get("license") ?? "").trim();
  const authority = String(formData.get("authority") ?? "");
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
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
    photoUrl: photoUrl || null,
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

  const { teamIds, ...coachFields } = parsed;
  const [inserted] = await db
    .insert(coaches)
    .values({ ...coachFields, createdAt: Date.now() })
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

  const { teamIds, ...coachFields } = parsed;
  await db.update(coaches).set(coachFields).where(eq(coaches.id, id));
  await syncCoachTeams(id, teamIds);

  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
  redirect("/admin/coaches");
}

export async function deleteCoach(id: number) {
  await db.delete(coaches).where(eq(coaches.id, id));
  revalidatePath("/admin/coaches");
  revalidatePath("/treneri");
}
```

- [ ] **Step 2: Write the list page**

Create `src/app/admin/(protected)/coaches/page.tsx`:

```tsx
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";

import { deleteCoach } from "./actions";

export default async function AdminCoachesPage() {
  const rows = await db.query.coaches.findMany({
    with: { coachTeams: { with: { team: true } } },
    orderBy: (coaches, { asc }) => [asc(coaches.name)],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Treneri</h1>
        <Link
          href="/admin/coaches/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Vārds, uzvārds</th>
            <th className="p-4 font-semibold">Amats</th>
            <th className="p-4 font-semibold">Komandas</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((coach) => (
            <tr key={coach.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{coach.name}</td>
              <td className="p-4 text-slate-500">{coach.position}</td>
              <td className="p-4 text-slate-500">
                {coach.coachTeams.map((ct) => ct.team.name).join(", ") || "—"}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/coaches/${coach.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
                  </Link>
                  <DeleteButton
                    action={deleteCoach.bind(null, coach.id)}
                    confirmMessage={`Dzēst treneri "${coach.name}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-slate-400">
                Vēl nav neviena trenera.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Write the create/edit form**

Create `src/app/admin/(protected)/coaches/[id]/coach-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";

import { createCoach, updateCoach } from "../actions";

type Coach = {
  id: number;
  name: string;
  position: string;
  license: string;
  authority: "UEFA" | "LFF";
  photoUrl: string | null;
  coachTeams: { teamId: number }[];
};
type TeamOption = { id: number; name: string };

export function CoachForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; coach: Coach; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createCoach : updateCoach.bind(null, props.coach.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const coach = props.mode === "edit" ? props.coach : null;
  const selectedTeamIds = new Set(coach?.coachTeams.map((ct) => ct.teamId) ?? []);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns treneris" : "Rediģēt treneri"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Vārds, uzvārds
        <input
          type="text"
          name="name"
          required
          defaultValue={coach?.name ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Amats
        <input
          type="text"
          name="position"
          placeholder="Galvenais treneris"
          required
          defaultValue={coach?.position ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Licence
        <input
          type="text"
          name="license"
          placeholder="UEFA A licence"
          required
          defaultValue={coach?.license ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Licences izdevējs</legend>
        <div className="mt-1.5 flex gap-4">
          {(["UEFA", "LFF"] as const).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="radio"
                name="authority"
                value={option}
                required
                defaultChecked={coach?.authority === option}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

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

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Komandas</legend>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {props.teamOptions.map((team) => (
            <label key={team.id} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="checkbox"
                name="teamIds"
                value={team.id}
                defaultChecked={selectedTeamIds.has(team.id)}
              />
              {team.name}
            </label>
          ))}
        </div>
      </fieldset>

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

Create `src/app/admin/(protected)/coaches/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { teams } from "@/db/schema";

import { CoachForm } from "./coach-form";

export default async function AdminCoachFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <CoachForm mode="create" teamOptions={teamOptions} />;
  }

  const coachId = Number(id);
  const coach = await db.query.coaches.findFirst({
    where: (coaches, { eq }) => eq(coaches.id, coachId),
    with: { coachTeams: true },
  });
  if (!coach) notFound();

  return <CoachForm mode="edit" coach={coach} teamOptions={teamOptions} />;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With at least two teams created, visit `/admin/coaches/new`: create a coach, check two team checkboxes, save. Confirm the list page shows both team names comma-separated. Edit the coach, uncheck one team, save, confirm the list updates to show only the remaining team. Delete the coach.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\(protected\)/coaches
git commit -m "feat: add coaches admin CRUD with multi-team assignment"
```

---

### Task 9: Trainings admin CRUD

**Files:**
- Create: `src/app/admin/(protected)/trainings/actions.ts`
- Create: `src/app/admin/(protected)/trainings/page.tsx`
- Create: `src/app/admin/(protected)/trainings/[id]/page.tsx`
- Create: `src/app/admin/(protected)/trainings/[id]/training-form.tsx`

**Interfaces:**
- Consumes: `db`, `trainings`, `teams` (Task 2); `DeleteButton` (Task 5).
- Produces: `createTraining`, `updateTraining(id: number, ...)`, `deleteTraining(id: number): Promise<void>`.

- [ ] **Step 1: Write the Server Actions**

Create `src/app/admin/(protected)/trainings/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { trainings } from "@/db/schema";

function parseTrainingInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;

  return {
    teamId,
    date,
    startTime,
    endTime: endTime || null,
    location,
    notes: notes || null,
  } as const;
}

export async function createTraining(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(trainings).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/trainings");
  redirect("/admin/trainings");
}

export async function updateTraining(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseTrainingInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(trainings).set(parsed).where(eq(trainings.id, id));
  revalidatePath("/admin/trainings");
  redirect("/admin/trainings");
}

export async function deleteTraining(id: number) {
  await db.delete(trainings).where(eq(trainings.id, id));
  revalidatePath("/admin/trainings");
}
```

(No `revalidatePath("/")` here yet — Task 15 wires the homepage calendar to read these rows and adds it then.)

- [ ] **Step 2: Write the list page**

Create `src/app/admin/(protected)/trainings/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { teams, trainings } from "@/db/schema";

import { deleteTraining } from "./actions";

export default async function AdminTrainingsPage() {
  const rows = await db
    .select({
      id: trainings.id,
      date: trainings.date,
      startTime: trainings.startTime,
      endTime: trainings.endTime,
      location: trainings.location,
      teamName: teams.name,
    })
    .from(trainings)
    .innerJoin(teams, eq(trainings.teamId, teams.id))
    .orderBy(trainings.date, trainings.startTime);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Treniņi</h1>
        <Link
          href="/admin/trainings/new"
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
            <th className="p-4 font-semibold">Vieta</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((training) => (
            <tr key={training.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-club-navy">{training.date}</td>
              <td className="p-4 text-slate-500">
                {training.startTime}
                {training.endTime ? `–${training.endTime}` : ""}
              </td>
              <td className="p-4 font-semibold text-club-navy">{training.teamName}</td>
              <td className="p-4 text-slate-500">{training.location}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/trainings/${training.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
                  </Link>
                  <DeleteButton
                    action={deleteTraining.bind(null, training.id)}
                    confirmMessage="Dzēst šo treniņu?"
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-slate-400">
                Vēl nav neviena treniņa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Write the create/edit form**

Create `src/app/admin/(protected)/trainings/[id]/training-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";

import { createTraining, updateTraining } from "../actions";

type Training = {
  id: number;
  teamId: number;
  date: string;
  startTime: string;
  endTime: string | null;
  location: string;
  notes: string | null;
};
type TeamOption = { id: number; name: string };

export function TrainingForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; training: Training; teamOptions: TeamOption[] },
) {
  const action =
    props.mode === "create" ? createTraining : updateTraining.bind(null, props.training.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const training = props.mode === "edit" ? props.training : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns treniņš" : "Rediģēt treniņu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={training?.teamId ?? ""}
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

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={training?.date ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Sākuma laiks
          <input
            type="time"
            name="startTime"
            required
            defaultValue={training?.startTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Beigu laiks (nav obligāts)
          <input
            type="time"
            name="endTime"
            defaultValue={training?.endTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Vieta
        <input
          type="text"
          name="location"
          required
          defaultValue={training?.location ?? "Olaines pilsētas stadions"}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={training?.notes ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

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

Create `src/app/admin/(protected)/trainings/[id]/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { teams, trainings } from "@/db/schema";

import { TrainingForm } from "./training-form";

export default async function AdminTrainingFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <TrainingForm mode="create" teamOptions={teamOptions} />;
  }

  const trainingId = Number(id);
  const [training] = await db.select().from(trainings).where(eq(trainings.id, trainingId));
  if (!training) notFound();

  return <TrainingForm mode="edit" training={training} teamOptions={teamOptions} />;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Visit `/admin/trainings/new`: create a training for an existing team, confirm it lists correctly sorted by date/time, edit it, delete it.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\(protected\)/trainings
git commit -m "feat: add trainings admin CRUD"
```

---

### Task 10: Events admin CRUD

**Files:**
- Create: `src/app/admin/(protected)/events/actions.ts`
- Create: `src/app/admin/(protected)/events/page.tsx`
- Create: `src/app/admin/(protected)/events/[id]/page.tsx`
- Create: `src/app/admin/(protected)/events/[id]/event-form.tsx`

**Interfaces:**
- Consumes: `db`, `events`, `teams` (Task 2); `DeleteButton` (Task 5).
- Produces: `createEvent`, `updateEvent(id: number, ...)`, `deleteEvent(id: number): Promise<void>`.

- [ ] **Step 1: Write the Server Actions**

Create `src/app/admin/(protected)/events/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { events } from "@/db/schema";

function parseEventInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const teamIdRaw = String(formData.get("teamId") ?? "");
  const teamId = teamIdRaw ? Number(teamIdRaw) : null;

  if (!title) return { error: "Nosaukums ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;

  return {
    title,
    date,
    startTime: startTime || null,
    endTime: endTime || null,
    location: location || null,
    notes: notes || null,
    teamId,
  } as const;
}

export async function createEvent(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(events).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEvent(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseEventInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(events).set(parsed).where(eq(events.id, id));
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function deleteEvent(id: number) {
  await db.delete(events).where(eq(events.id, id));
  revalidatePath("/admin/events");
}
```

- [ ] **Step 2: Write the list page**

Create `src/app/admin/(protected)/events/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { events, teams } from "@/db/schema";

import { deleteEvent } from "./actions";

export default async function AdminEventsPage() {
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      startTime: events.startTime,
      teamName: teams.name,
    })
    .from(events)
    .leftJoin(teams, eq(events.teamId, teams.id))
    .orderBy(events.date);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Notikumi</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((event) => (
            <tr key={event.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{event.title}</td>
              <td className="p-4 text-club-navy">{event.date}</td>
              <td className="p-4 text-slate-500">{event.startTime ?? "visu dienu"}</td>
              <td className="p-4 text-slate-500">{event.teamName ?? "Viss klubs"}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
                  </Link>
                  <DeleteButton
                    action={deleteEvent.bind(null, event.id)}
                    confirmMessage={`Dzēst notikumu "${event.title}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-slate-400">
                Vēl nav neviena notikuma.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Write the create/edit form**

Create `src/app/admin/(protected)/events/[id]/event-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";

import { createEvent, updateEvent } from "../actions";

type Event = {
  id: number;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  notes: string | null;
  teamId: number | null;
};
type TeamOption = { id: number; name: string };

export function EventForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; event: Event; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createEvent : updateEvent.bind(null, props.event.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const event = props.mode === "edit" ? props.event : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns notikums" : "Rediģēt notikumu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Nosaukums
        <input
          type="text"
          name="title"
          required
          defaultValue={event?.title ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={event?.date ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Sākuma laiks (nav obligāts — tukšs nozīmē &quot;visu dienu&quot;)
          <input
            type="time"
            name="startTime"
            defaultValue={event?.startTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Beigu laiks (nav obligāts)
          <input
            type="time"
            name="endTime"
            defaultValue={event?.endTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Vieta (nav obligāta)
        <input
          type="text"
          name="location"
          defaultValue={event?.location ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda (nav obligāta — atstāj tukšu visam klubam)
        <select
          name="teamId"
          defaultValue={event?.teamId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="">Viss klubs</option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={event?.notes ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

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

Create `src/app/admin/(protected)/events/[id]/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { events, teams } from "@/db/schema";

import { EventForm } from "./event-form";

export default async function AdminEventFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <EventForm mode="create" teamOptions={teamOptions} />;
  }

  const eventId = Number(id);
  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) notFound();

  return <EventForm mode="edit" event={event} teamOptions={teamOptions} />;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Visit `/admin/events/new`: create a club-wide event (leave team unset), confirm it lists "Viss klubs"; create a second event tied to a team, confirm it lists that team's name. Edit and delete both.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\(protected\)/events
git commit -m "feat: add events admin CRUD"
```

---

### Task 11: Games admin CRUD

**Files:**
- Create: `src/app/admin/(protected)/games/actions.ts`
- Create: `src/app/admin/(protected)/games/page.tsx`
- Create: `src/app/admin/(protected)/games/[id]/page.tsx`
- Create: `src/app/admin/(protected)/games/[id]/game-form.tsx`

**Interfaces:**
- Consumes: `db`, `games`, `teams` (Task 2); `DeleteButton` (Task 5).
- Produces: `createGame`, `updateGame(id: number, ...)`, `deleteGame(id: number): Promise<void>`.

- [ ] **Step 1: Write the Server Actions**

Create `src/app/admin/(protected)/games/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { games } from "@/db/schema";

function parseGameInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const opponent = String(formData.get("opponent") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const homeAway = String(formData.get("homeAway") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!opponent) return { error: "Pretinieks ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (homeAway !== "home" && homeAway !== "away") {
    return { error: "Jāizvēlas mājas vai izbraukuma spēle." } as const;
  }

  return {
    teamId,
    opponent,
    date,
    time: time || null,
    homeAway: homeAway as "home" | "away",
    location: location || null,
    notes: notes || null,
  } as const;
}

export async function createGame(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(games).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function updateGame(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(games).set(parsed).where(eq(games.id, id));
  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function deleteGame(id: number) {
  await db.delete(games).where(eq(games.id, id));
  revalidatePath("/admin/games");
}
```

- [ ] **Step 2: Write the list page**

Create `src/app/admin/(protected)/games/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { games, teams } from "@/db/schema";

import { deleteGame } from "./actions";

export default async function AdminGamesPage() {
  const rows = await db
    .select({
      id: games.id,
      opponent: games.opponent,
      date: games.date,
      homeAway: games.homeAway,
      teamName: teams.name,
    })
    .from(games)
    .innerJoin(teams, eq(games.teamId, teams.id))
    .orderBy(games.date);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">
          Spēles <span className="text-base font-normal text-slate-400">(neliga)</span>
        </h1>
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
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4 font-semibold">Pretinieks</th>
            <th className="p-4 font-semibold">Māja / izbraukums</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((game) => (
            <tr key={game.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-club-navy">{game.date}</td>
              <td className="p-4 font-semibold text-club-navy">{game.teamName}</td>
              <td className="p-4 text-slate-500">{game.opponent}</td>
              <td className="p-4 text-slate-500">
                {game.homeAway === "home" ? "Mājās" : "Izbraukumā"}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/games/${game.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
                  </Link>
                  <DeleteButton
                    action={deleteGame.bind(null, game.id)}
                    confirmMessage={`Dzēst spēli pret "${game.opponent}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-slate-400">
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

- [ ] **Step 3: Write the create/edit form**

Create `src/app/admin/(protected)/games/[id]/game-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";

import { createGame, updateGame } from "../actions";

type Game = {
  id: number;
  teamId: number;
  opponent: string;
  date: string;
  time: string | null;
  homeAway: "home" | "away";
  location: string | null;
  notes: string | null;
};
type TeamOption = { id: number; name: string };

export function GameForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; game: Game; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createGame : updateGame.bind(null, props.game.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const game = props.mode === "edit" ? props.game : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauna spēle" : "Rediģēt spēli"}
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Tikai neliga spēles (draudzības, kausa spēles). Oficiālās līgas spēles nāk no lff.lv.
      </p>

      <label className="block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={game?.teamId ?? ""}
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

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Pretinieks
        <input
          type="text"
          name="opponent"
          required
          defaultValue={game?.opponent ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Datums
          <input
            type="date"
            name="date"
            required
            defaultValue={game?.date ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Laiks (nav obligāts)
          <input
            type="time"
            name="time"
            defaultValue={game?.time ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Māja / izbraukums</legend>
        <div className="mt-1.5 flex gap-4">
          {(
            [
              { value: "home", label: "Mājās" },
              { value: "away", label: "Izbraukumā" },
            ] as const
          ).map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-club-navy">
              <input
                type="radio"
                name="homeAway"
                value={option.value}
                required
                defaultChecked={game?.homeAway === option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Vieta (nav obligāta)
        <input
          type="text"
          name="location"
          defaultValue={game?.location ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={game?.notes ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

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

Create `src/app/admin/(protected)/games/[id]/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { games, teams } from "@/db/schema";

import { GameForm } from "./game-form";

export default async function AdminGameFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <GameForm mode="create" teamOptions={teamOptions} />;
  }

  const gameId = Number(id);
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) notFound();

  return <GameForm mode="edit" game={game} teamOptions={teamOptions} />;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Visit `/admin/games/new`: create a friendly game for an existing team, confirm it lists correctly with the right home/away label, edit it, delete it.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\(protected\)/games
git commit -m "feat: add games (non-league) admin CRUD"
```

---

### Task 12: Seed script

**Files:**
- Create: `src/db/seed.ts`

**Interfaces:**
- Consumes: `db`, `teams`, `players`, `coaches`, `coachTeams` (Task 2).
- Produces: a one-off script (`npm run db:seed`), not imported by anything else.

- [ ] **Step 1: Write the seed script**

Create `src/db/seed.ts` — this is a straight port of today's hardcoded `TEAMS` array from `src/components/teams-directory.tsx` and `COACHES` array from `src/components/coaches-directory.tsx`:

```ts
import "dotenv/config";

import { db } from "./client";
import { coachTeams, coaches, players, teams } from "./schema";

const ROSTER_TEAMS = [
  {
    name: "1. komanda",
    players: [
      { name: "Signe Kalēja", birthdate: "12.04.1998." },
      { name: "Dita Vītola", birthdate: "03.09.2000." },
      { name: "Everita Bērziņa", birthdate: "22.01.1997." },
      { name: "Katrīna Liepa", birthdate: "15.06.1999." },
      { name: "Alise Zariņa", birthdate: "08.11.2001." },
      { name: "Marta Kundziņa", birthdate: "27.02.1996." },
      { name: "Rūta Ozoliņa", birthdate: "19.07.2002." },
      { name: "Annija Krasta", birthdate: "05.03.1995." },
      { name: "Elza Bergmane", birthdate: "30.10.2000." },
      { name: "Sabīne Auniņa", birthdate: "14.05.1999." },
    ],
  },
  {
    name: "U16",
    players: [
      { name: "Justīne Vanaga", birthdate: "11.02.2010." },
      { name: "Elīna Broka", birthdate: "24.06.2009." },
      { name: "Patrīcija Siliņa", birthdate: "03.10.2010." },
      { name: "Adele Kalve", birthdate: "17.01.2009." },
      { name: "Anete Rubene", birthdate: "29.08.2010." },
      { name: "Sindija Priede", birthdate: "06.04.2009." },
      { name: "Estere Miķelsone", birthdate: "20.12.2010." },
      { name: "Karlīna Dūmiņa", birthdate: "09.05.2009." },
    ],
  },
  {
    name: "U14",
    players: [
      { name: "Emīls Grigorjevs", birthdate: "14.03.2012." },
      { name: "Kristers Ābols", birthdate: "02.07.2011." },
      { name: "Ralfs Circenis", birthdate: "25.09.2012." },
      { name: "Artis Rozītis", birthdate: "18.01.2011." },
      { name: "Matīss Vanags", birthdate: "07.11.2012." },
      { name: "Ņikita Sokolovs", birthdate: "30.06.2011." },
      { name: "Toms Šķēle", birthdate: "12.02.2012." },
      { name: "Rihards Buls", birthdate: "23.08.2011." },
    ],
  },
  {
    name: "U12",
    players: [
      { name: "Roberts Zvaigzne", birthdate: "05.04.2014." },
      { name: "Edgars Cīrulis", birthdate: "19.10.2013." },
      { name: "Kaspars Liniņš", birthdate: "08.01.2014." },
      { name: "Renārs Ķauķis", birthdate: "27.05.2013." },
      { name: "Markuss Bite", birthdate: "14.09.2014." },
      { name: "Ādams Grava", birthdate: "03.12.2013." },
      { name: "Oskars Bariss", birthdate: "21.06.2014." },
      { name: "Valters Muižnieks", birthdate: "09.02.2013." },
    ],
  },
  {
    name: "U10",
    players: [
      { name: "Kārlis Ancāns", birthdate: "16.03.2016." },
      { name: "Bruno Ezeriņš", birthdate: "02.08.2015." },
      { name: "Kristiāns Sila", birthdate: "28.11.2016." },
      { name: "Ernests Vilks", birthdate: "13.05.2015." },
      { name: "Alekss Riekstiņš", birthdate: "07.01.2016." },
      { name: "Deniss Zariņš", birthdate: "22.09.2015." },
      { name: "Gustavs Krūmiņš", birthdate: "30.04.2016." },
      { name: "Elvis Ostrovskis", birthdate: "11.07.2015." },
    ],
  },
  {
    name: "Vārtsargu grupa",
    players: [
      { name: "Sanija Melnalksne", birthdate: "19.02.2009." },
      { name: "Dāvis Kronbergs", birthdate: "04.06.2012." },
      { name: "Estere Zvirbule", birthdate: "26.10.2014." },
      { name: "Ivo Pētersons", birthdate: "15.03.2016." },
      { name: "Reinis Gaigals", birthdate: "08.09.2010." },
      { name: "Amanda Strazda", birthdate: "21.01.2013." },
    ],
  },
];

const COACHES_SEED = [
  {
    name: "Jānis Bērziņš",
    position: "Galvenais treneris",
    license: "UEFA A licence",
    authority: "UEFA" as const,
    teamNames: ["1. komanda"],
  },
  {
    name: "Laura Ozola",
    position: "Trenere",
    license: "UEFA B licence",
    authority: "UEFA" as const,
    teamNames: ["U16"],
  },
  {
    name: "Mārtiņš Kalniņš",
    position: "Treneris",
    license: "UEFA B licence",
    authority: "UEFA" as const,
    teamNames: ["U14"],
  },
  {
    name: "Andris Liepiņš",
    position: "Vārtsargu treneris",
    license: "UEFA Vārtsargu licence",
    authority: "UEFA" as const,
    teamNames: ["1. komanda", "U16"],
  },
  {
    name: "Rihards Kļaviņš",
    position: "Treneris",
    license: "UEFA C licence",
    authority: "UEFA" as const,
    teamNames: ["U12"],
  },
  {
    name: "Elīna Krūmiņa",
    position: "Trenere",
    license: "UEFA C licence",
    authority: "UEFA" as const,
    teamNames: ["U10"],
  },
  {
    name: "Kristaps Zeltiņš",
    position: "Fiziskās sagatavotības treneris",
    license: "LFF fiziskās sagatavotības sertifikāts",
    authority: "LFF" as const,
    // Not a roster team — this coach's original hardcoded data used it as a
    // specialization label, not a squad. Seeded as its own Team row below
    // so the coach still displays it, matching current site behavior.
    teamNames: ["Fiziskā sagatavotība"],
  },
  {
    name: "Artūrs Ivanovs",
    position: "Asistenta treneris",
    license: "UEFA B licence",
    authority: "UEFA" as const,
    teamNames: ["1. komanda"],
  },
];

async function main() {
  const rosterTeamNames = new Set(ROSTER_TEAMS.map((t) => t.name));
  const extraTeamNames = [
    ...new Set(
      COACHES_SEED.flatMap((c) => c.teamNames).filter((name) => !rosterTeamNames.has(name)),
    ),
  ];

  const teamIdByName = new Map<string, number>();

  for (const team of ROSTER_TEAMS) {
    const [inserted] = await db
      .insert(teams)
      .values({ name: team.name, createdAt: Date.now() })
      .returning({ id: teams.id });
    teamIdByName.set(team.name, inserted.id);

    for (const player of team.players) {
      await db.insert(players).values({
        teamId: inserted.id,
        name: player.name,
        birthdate: player.birthdate,
        photoUrl: null,
        createdAt: Date.now(),
      });
    }
  }

  for (const name of extraTeamNames) {
    const [inserted] = await db
      .insert(teams)
      .values({ name, createdAt: Date.now() })
      .returning({ id: teams.id });
    teamIdByName.set(name, inserted.id);
  }

  for (const coach of COACHES_SEED) {
    const [inserted] = await db
      .insert(coaches)
      .values({
        name: coach.name,
        position: coach.position,
        license: coach.license,
        authority: coach.authority,
        photoUrl: "/coach-portrait.png",
        createdAt: Date.now(),
      })
      .returning({ id: coaches.id });

    for (const teamName of coach.teamNames) {
      const teamId = teamIdByName.get(teamName);
      if (teamId) {
        await db.insert(coachTeams).values({ coachId: inserted.id, teamId });
      }
    }
  }

  console.log(
    `Seeded ${ROSTER_TEAMS.length + extraTeamNames.length} teams, ` +
      `${ROSTER_TEAMS.reduce((sum, t) => sum + t.players.length, 0)} players, ` +
      `${COACHES_SEED.length} coaches.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run db:seed`
Expected: prints `Seeded 7 teams, 48 players, 8 coaches.` (6 roster teams + 1 extra "Fiziskā sagatavotība" team).

Run `npm run db:studio` and open the printed URL — confirm the `teams`, `players`, `coaches`, and `coach_teams` tables are populated as expected (e.g. "Andris Liepiņš" has two `coach_teams` rows).

If you need to re-run the seed later against a database that already has this data, delete `local.db` first (`rm local.db*`) and re-run `npm run db:push` then `npm run db:seed` — the script has no duplicate-guard, it's meant for a one-time first-deploy seed as the spec describes.

- [ ] **Step 3: Commit**

```bash
git add src/db/seed.ts
git commit -m "feat: add one-off seed script porting hardcoded roster data"
```

---

### Task 13: Wire `/komandas` to the database

**Files:**
- Modify: `src/app/komandas/page.tsx`
- Modify: `src/components/teams-directory.tsx`

**Interfaces:**
- Consumes: `db` (Task 2).
- Produces: `TeamsDirectory({ teams }: { teams: Team[] })` — the component's exported `Team`/`Player` types are unchanged in shape, it now takes data as a prop instead of importing a hardcoded array.

- [ ] **Step 1: Update the page to fetch from the database**

Replace the full contents of `src/app/komandas/page.tsx`:

```tsx
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TeamsDirectory } from "@/components/teams-directory";
import { db } from "@/db/client";

export default async function KomandasPage() {
  const rows = await db.query.teams.findMany({
    with: { players: true },
    orderBy: (teams, { asc }) => [asc(teams.name)],
  });

  const teams = rows.map((team) => ({
    name: team.name,
    players: team.players
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "lv"))
      .map((player) => ({
        name: player.name,
        birthdate: player.birthdate,
        photo: player.photoUrl ?? undefined,
      })),
  }));

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <TeamsDirectory teams={teams} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Make the component take its data as a prop**

In `src/components/teams-directory.tsx`:

- Delete the entire `const TEAMS: Team[] = [...]` array (lines 21–100 in the current file).
- Change the module-level `const CATEGORIES = [...]` and `const TOTAL_PLAYERS = ...` (currently derived from `TEAMS`) into values computed inside the component from the new `teams` prop instead.
- Change the exported function's signature.

Specifically, replace:

```tsx
const CATEGORIES = ["Visas komandas", ...TEAMS.map((team) => team.name)];

const TOTAL_PLAYERS = TEAMS.reduce((sum, team) => sum + team.players.length, 0);
```

and

```tsx
export function TeamsDirectory() {
  const [activeCategory, setActiveCategory] = useState("Visas komandas");

  const visible =
    activeCategory === "Visas komandas"
      ? TEAMS
      : TEAMS.filter((team) => team.name === activeCategory);
```

with:

```tsx
export function TeamsDirectory({ teams }: { teams: Team[] }) {
  const [activeCategory, setActiveCategory] = useState("Visas komandas");

  const categories = ["Visas komandas", ...teams.map((team) => team.name)];
  const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);

  const visible =
    activeCategory === "Visas komandas"
      ? teams
      : teams.filter((team) => team.name === activeCategory);
```

Then update the two places further down that still reference the old names:

```tsx
{CATEGORIES.map((category) => (
```
→
```tsx
{categories.map((category) => (
```

and

```tsx
{TOTAL_PLAYERS} spēlētāji
```
→
```tsx
{totalPlayers} spēlētāji
```

Everything else in the file (the `Player`/`Team` type definitions, `PlayerCard`, `TeamSection`, the hero markup, the filter buttons, the grid) stays exactly as it is.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Visit `/komandas` in the browser. Expected: shows the 6 roster teams and their players from the seeded database (identical to what the hardcoded array used to render, since the seed data is a direct port). Add a player via `/admin/players/new` for an existing team, refresh `/komandas`, confirm the new player appears.

- [ ] **Step 4: Commit**

```bash
git add src/app/komandas/page.tsx src/components/teams-directory.tsx
git commit -m "feat: wire /komandas to read teams and players from the database"
```

---

### Task 14: Wire `/treneri` to the database

**Files:**
- Modify: `src/app/treneri/page.tsx`
- Modify: `src/components/coaches-directory.tsx`

**Interfaces:**
- Consumes: `db` (Task 2).
- Produces: `CoachesDirectory({ coaches }: { coaches: Coach[] })` — same `Coach` shape as today, now passed as a prop.

- [ ] **Step 1: Update the page to fetch from the database**

Replace the full contents of `src/app/treneri/page.tsx`:

```tsx
import { CoachesDirectory } from "@/components/coaches-directory";
import { JoinTeamCta } from "@/components/join-team-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db/client";

export default async function TreneriPage() {
  const rows = await db.query.coaches.findMany({
    with: { coachTeams: { with: { team: true } } },
    orderBy: (coaches, { asc }) => [asc(coaches.name)],
  });

  const coaches = rows.map((coach) => ({
    name: coach.name,
    position: coach.position,
    license: coach.license,
    authority: coach.authority,
    teams: coach.coachTeams.map((ct) => ct.team.name),
    photo: coach.photoUrl ?? undefined,
  }));

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <CoachesDirectory coaches={coaches} />
      </main>
      <JoinTeamCta />
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Make the component take its data as a prop**

In `src/components/coaches-directory.tsx`:

- Delete the entire `const COACHES: Coach[] = [...]` array (lines 26–91 in the current file). Keep the `type LicenseAuthority`, `AUTHORITY_LOGO`, and `type Coach` declarations — they're still needed.
- Change the module-level `const CATEGORIES = [...]` (currently a fixed list including labels like "Vārtsargu treneri" and "Fiziskā sagatavotība" that don't all correspond to real `Team` rows) to be computed from the actual team names now present in the data, same pattern as Task 13.

Replace:

```tsx
const CATEGORIES = [
  "Visi",
  "1. komanda",
  "U16",
  "U14",
  "U12",
  "U10",
  "Vārtsargu treneri",
  "Fiziskā sagatavotība",
];
```

(delete this block entirely — it moves inside the component below).

Replace:

```tsx
export function CoachesDirectory() {
  const [activeCategory, setActiveCategory] = useState("Visi");

  const visible =
    activeCategory === "Visi"
      ? COACHES
      : COACHES.filter((coach) => coach.teams.includes(activeCategory));
```

with:

```tsx
export function CoachesDirectory({ coaches }: { coaches: Coach[] }) {
  const [activeCategory, setActiveCategory] = useState("Visi");

  const categories = [
    "Visi",
    ...new Set(coaches.flatMap((coach) => coach.teams)),
  ];

  const visible =
    activeCategory === "Visi"
      ? coaches
      : coaches.filter((coach) => coach.teams.includes(activeCategory));
```

Then update the two remaining references:

```tsx
{CATEGORIES.map((category) => (
```
→
```tsx
{categories.map((category) => (
```

and

```tsx
<span className="text-club-navy">{COACHES.length}</span>
```
→
```tsx
<span className="text-club-navy">{coaches.length}</span>
```

Everything else (the `CoachCard` component, hero markup, grid) is unchanged.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Visit `/treneri`. Expected: shows the 8 seeded coaches with the same team badges as before (e.g. Andris Liepiņš shows "1. komanda / U16"). Edit a coach's team assignment via `/admin/coaches`, refresh `/treneri`, confirm the badge updates.

- [ ] **Step 4: Commit**

```bash
git add src/app/treneri/page.tsx src/components/coaches-directory.tsx
git commit -m "feat: wire /treneri to read coaches from the database"
```

---

### Task 15: Wire the calendar to the database and delete the recurring generator

**Files:**
- Modify: `src/lib/calendar.ts`

**Interfaces:**
- Consumes: `db`, `trainings`, `events`, `games`, `teams` (Task 2).
- Produces: unchanged public API — `CalendarEvent`, `getClubFixtureEvents()`, `getScheduleForWeekBrowsing()` keep the exact same names and return shape, so `src/components/calendar-section.tsx` and `src/components/week-calendar.tsx` need **no changes**.

- [ ] **Step 1: Delete the recurring generator**

In `src/lib/calendar.ts`, delete these (currently lines 76–173 in the file, right after `formatLabels`):

- the `TrainingSlot` type
- the `HOME_GROUND` constant
- the `TRAINING_SCHEDULE` array
- the `rigaDateKeyParts` function
- the `generateTrainingEvents` function

Everything from `formatLabels` through the end of that block goes; `rigaWallClockToUtc`, `fixtureToCalendarEvent`, and `getClubFixtureEvents` (which come after it) stay untouched.

- [ ] **Step 2: Add the database-backed event queries**

Add these imports at the top of the file:

```ts
import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db/client";
import { events, games, teams, trainings } from "@/db/schema";
```

Add this helper right after `formatLabels` (it replaces the deleted `rigaDateKeyParts` for the one thing still needed — turning a `Date` into a `"YYYY-MM-DD"` string for comparing against the `date` columns):

```ts
function toDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function timeToParts(time: string): [number, number] {
  const [hour, minute] = time.split(":").map(Number);
  return [hour, minute];
}

function dateKeyToParts(dateKey: string): [number, number, number] {
  const [year, month, day] = dateKey.split("-").map(Number);
  return [year, month, day];
}
```

Add the three query functions right after `getClubFixtureEvents` (before `weekBrowsingWindow`):

```ts
async function getAdminTrainingEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: trainings.id,
      date: trainings.date,
      startTime: trainings.startTime,
      endTime: trainings.endTime,
      location: trainings.location,
      teamName: teams.name,
    })
    .from(trainings)
    .innerJoin(teams, eq(trainings.teamId, teams.id))
    .where(and(gte(trainings.date, afterKey), lte(trainings.date, beforeKey)));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const [startHour, startMinute] = timeToParts(row.startTime);
    const start = rigaWallClockToUtc(year, month, day, startHour, startMinute);
    const end = row.endTime
      ? rigaWallClockToUtc(year, month, day, ...timeToParts(row.endTime))
      : new Date(start.getTime() + 60 * 60 * 1000);

    return {
      uid: `training-${row.id}`,
      title: `${row.teamName} treniņš`,
      location: row.location,
      allDay: false,
      start,
      end,
      source: "calendar",
      eventType: "training",
      ...formatLabels(start, false),
    };
  });
}

async function getAdminEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      startTime: events.startTime,
      location: events.location,
    })
    .from(events)
    .where(and(gte(events.date, afterKey), lte(events.date, beforeKey)));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const allDay = !row.startTime;
    const start = row.startTime
      ? rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime))
      : rigaWallClockToUtc(year, month, day, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    return {
      uid: `event-${row.id}`,
      title: row.title,
      location: row.location,
      allDay,
      start,
      end,
      source: "calendar",
      eventType: "other",
      ...formatLabels(start, allDay),
    };
  });
}

async function getAdminGameEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: games.id,
      opponent: games.opponent,
      date: games.date,
      time: games.time,
      homeAway: games.homeAway,
      location: games.location,
      teamName: teams.name,
    })
    .from(games)
    .innerJoin(teams, eq(games.teamId, teams.id))
    .where(and(gte(games.date, afterKey), lte(games.date, beforeKey)));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const [hour, minute] = row.time ? timeToParts(row.time) : [12, 0];
    const start = rigaWallClockToUtc(year, month, day, hour, minute);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const opponentLabel =
      row.homeAway === "home"
        ? `${row.teamName} – ${row.opponent}`
        : `${row.opponent} – ${row.teamName}`;

    return {
      uid: `game-${row.id}`,
      title: opponentLabel,
      location: row.location,
      allDay: false,
      start,
      end,
      source: "calendar",
      eventType: "game",
      ...formatLabels(start, false),
    };
  });
}
```

- [ ] **Step 3: Update `getScheduleForWeekBrowsing`**

Replace:

```ts
export async function getScheduleForWeekBrowsing(): Promise<CalendarEvent[]> {
  const { after, before } = weekBrowsingWindow();
  const [fixtureEvents] = await Promise.all([
    getClubFixtureEvents().catch(() => []),
  ]);
  const trainingEvents = generateTrainingEvents(after, before);

  return [...trainingEvents, ...fixtureEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}
```

with:

```ts
export async function getScheduleForWeekBrowsing(): Promise<CalendarEvent[]> {
  const { after, before } = weekBrowsingWindow();

  const [fixtureEvents, trainingEvents, otherEvents, gameEvents] = await Promise.all([
    getClubFixtureEvents().catch(() => []),
    getAdminTrainingEvents(after, before).catch(() => []),
    getAdminEvents(after, before).catch(() => []),
    getAdminGameEvents(after, before).catch(() => []),
  ]);

  return [...fixtureEvents, ...trainingEvents, ...otherEvents, ...gameEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors — this also confirms nothing outside `calendar.ts` broke, since the exported function names and `CalendarEvent` shape didn't change.

Visit `/` (the homepage) and scroll to the "Kalendārs" section. Expected: the training sessions that used to come from the recurring generator are gone (there's no seeded `Training` data yet), but league fixtures (from `getClubFixtureEvents`, unaffected) still show. Add a training via `/admin/trainings/new` dated for the current week, refresh the homepage, confirm it now appears in the calendar with the right team name, date, and time. Add an "other" event and a friendly game the same way and confirm both appear correctly categorized.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calendar.ts
git commit -m "feat: replace recurring training generator with database-backed calendar events"
```

---

## Post-plan note for deployment

This plan only covers local development (`file:./local.db`). Before deploying:

1. Create a Turso database (`turso db create fk-olaine`) and get its URL and auth token.
2. Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET` (a real random value), and `ADMIN_PASSWORD` (a real password) in the host's environment variables.
3. Run `npm run db:push` once against production credentials to create the tables there.
4. Run `npm run db:seed` once against production credentials to port the current roster/coach data, so `/komandas` and `/treneri` aren't empty on first deploy.

This is manual, one-time setup — not part of the app's request path, matching the spec's Deployment section.
