# LFF League Game Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin fetch official league fixtures from an LFF URL, review them, and confirm which ones get written into the database, replacing the site's live-fetched-on-every-request fixture pipeline.

**Architecture:** A new `league_sources` table holds admin-managed import sources (label + LFF URL + which club team it maps to). `games.opponent`/`homeAway` are replaced with `homeTeam`/`awayTeam` (both sides' real names), plus new `source` ("manual"|"lff") and `league` (nullable label) columns. `src/lib/fixtures.ts` is rewritten into a single `scrapeFixtures(url)` function usable against any LFF fixtures URL. An admin import screen scrapes a source's URL, shows FK Olaine's fixtures with a checkbox per not-yet-imported one, and a confirm action inserts the selected ones as `games` rows. The homepage "next match" widget and calendar read games from the DB instead of live-fetching.

**Tech Stack:** Drizzle ORM + Turso/libSQL (existing), cheerio (existing, for HTML scraping), Next.js Server Actions.

**Spec:** `docs/superpowers/specs/2026-09-08-lff-game-import-design.md`

## Global Constraints

- Standings (`src/lib/standings.ts`, `getStandings`) are completely untouched — they stay live-fetched.
- No match scores/results are stored — out of scope per the spec.
- No auto re-sync of already-imported fixtures if LFF changes a kickoff time — admin edits that `games` row manually.
- `source` is never shown or editable in the manual games admin form — it's set automatically by whichever code path creates the row (`"manual"` for the manual form, `"lff"` for the import confirm action).

---

### Task 1: Games schema rename (opponent/homeAway → homeTeam/awayTeam, + source/league) and its consumers

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/app/admin/(protected)/games/actions.ts`
- Modify: `src/app/admin/(protected)/games/[id]/game-form.tsx`
- Modify: `src/app/admin/(protected)/games/page.tsx`
- Modify: `src/lib/calendar.ts` (only the `getAdminGameEvents` function)

**Interfaces:**
- Consumes: `db`, `teams` (existing).
- Produces: `games` table shape `{ id, teamId, homeTeam, awayTeam, date, startTime, endTime, location, notes, source: "manual" | "lff", league: string | null, createdAt }`, consumed by Task 4's import confirm action.

- [ ] **Step 1: Update the schema**

In `src/db/schema.ts`, replace the `games` table definition:

```ts
export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  notes: text("notes"),
  source: text("source", { enum: ["manual", "lff"] }).notNull().default("manual"),
  league: text("league"),
  createdAt: integer("created_at").notNull(),
});
```

(This replaces the old `opponent: text("opponent").notNull()` and `homeAway: text("home_away", { enum: ["home", "away"] }).notNull()` fields, and adds `source`/`league`. Everything else on the table is unchanged.)

- [ ] **Step 2: Update the games Server Actions**

Replace the full contents of `src/app/admin/(protected)/games/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { games } from "@/db/schema";

function parseGameInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const homeTeam = String(formData.get("homeTeam") ?? "").trim();
  const awayTeam = String(formData.get("awayTeam") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const league = String(formData.get("league") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!homeTeam) return { error: "Mājinieki ir obligāti." } as const;
  if (!awayTeam) return { error: "Viesi ir obligāti." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;

  return {
    teamId,
    homeTeam,
    awayTeam,
    date,
    startTime,
    endTime,
    location,
    league: league || null,
    notes: notes || null,
  } as const;
}

export async function createGame(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = parseGameInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(games).values({ ...parsed, source: "manual", createdAt: Date.now() });
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

(`updateGame` deliberately does not touch `source` — editing a game via this form never changes whether it was manually entered or LFF-imported.)

- [ ] **Step 3: Update the games form**

Replace the full contents of `src/app/admin/(protected)/games/[id]/game-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";

import { createGame, updateGame } from "../actions";

type Game = {
  id: number;
  teamId: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  league: string | null;
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

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Mājinieki
          <input
            type="text"
            name="homeTeam"
            required
            placeholder="FK Olaine"
            defaultValue={game?.homeTeam ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Viesi
          <input
            type="text"
            name="awayTeam"
            required
            placeholder="FK Ventspils"
            defaultValue={game?.awayTeam ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={game?.date ?? ""}
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
            defaultValue={game?.startTime ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Beigu laiks
          <input
            type="time"
            name="endTime"
            required
            defaultValue={game?.endTime ?? ""}
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
          defaultValue={game?.location ?? "Olaines pilsētas stadions"}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Sacensības (nav obligāts)
        <input
          type="text"
          name="league"
          placeholder="Draudzības spēle"
          defaultValue={game?.league ?? ""}
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

`src/app/admin/(protected)/games/[id]/page.tsx` needs no changes — it does `db.select().from(games).where(...)`, so the row shape follows the schema automatically.

- [ ] **Step 4: Update the games list page**

Replace the full contents of `src/app/admin/(protected)/games/page.tsx`:

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
              <td className="p-4 text-slate-500">{game.homeTeam}</td>
              <td className="p-4 text-slate-500">{game.awayTeam}</td>
              <td className="p-4 text-slate-500">{game.league ?? "Draudzības spēle"}</td>
              <td className="p-4 text-slate-500">{game.location}</td>
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

- [ ] **Step 5: Update `getAdminGameEvents` in the calendar**

In `src/lib/calendar.ts`, replace the `getAdminGameEvents` function:

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
    })
    .from(games)
    .where(and(gte(games.date, afterKey), lte(games.date, beforeKey)));

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
      source: "calendar",
      eventType: "game",
      ...formatLabels(start, false),
    };
  });
}
```

(This drops the join to `teams` that the old version needed for `teamName` — `homeTeam`/`awayTeam` already carry both sides' names directly. The `teams` import in this file is still needed for `getAdminTrainingEvents`, so don't remove it.)

- [ ] **Step 6: Push the schema and reseed**

Run:
```bash
rm -f local.db*
npm run db:push -- --force
npm run db:seed
```
Expected: `Changes applied`, then `Seeded 7 teams, 48 players, 8 coaches.`

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With the dev server running (restart it if one is already running against the old `local.db`), log into `/admin`, visit `/admin/games/new`: create a game with home/away team names, a league label, and one with the league field left blank. Confirm the list shows both, with the blank one displaying "Draudzības spēle". Edit and delete one.

- [ ] **Step 8: Commit**

```bash
git add src/db/schema.ts "src/app/admin/(protected)/games" src/lib/calendar.ts
git commit -m "feat: replace games opponent/homeAway with homeTeam/awayTeam, add source/league"
```

---

### Task 2: Generalize the LFF scraper, remove the live-fixture pipeline, rewire the homepage

**Files:**
- Modify: `src/lib/fixtures.ts` (full rewrite)
- Modify: `src/lib/calendar.ts` (remove `getClubFixtureEvents`/`fixtureToCalendarEvent`, drop `CalendarEvent.source`, update `getScheduleForWeekBrowsing`, export `toDateKey`)
- Modify: `src/components/hero.tsx` (`fetchUpcomingGames` now reads the DB)

**Interfaces:**
- Consumes: `db`, `games` (Task 1's shape); `isOlaine`, `Team`, `UpcomingGame` from `@/lib/games` (existing, unchanged).
- Produces: `scrapeFixtures(url: string): Promise<ScrapedFixture[]>` from `src/lib/fixtures.ts`, consumed by Task 4's import screen. `export function toDateKey(date: Date): string` from `src/lib/calendar.ts`, consumed by `hero.tsx`.

- [ ] **Step 1: Rewrite the scraper**

Replace the full contents of `src/lib/fixtures.ts`:

```ts
import * as cheerio from "cheerio";

export type ScrapedFixture = {
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM", or null if LFF hasn't published a kickoff time yet. */
  time: string | null;
  home: string;
  away: string;
  stadium: string;
  played: boolean;
};

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  mai: 5,
  jūn: 6,
  jūl: 7,
  aug: 8,
  sep: 9,
  okt: 10,
  nov: 11,
  dec: 12,
};

/** LFF fixtures pages carry the "which tab is this" info directly in their
 *  own URL (`?tab=content_1_2`) — the tab element's id is always "tab" plus
 *  that value, so there's nothing extra for an admin to configure. */
function tabIdFromUrl(url: string): string {
  const tab = new URL(url).searchParams.get("tab");
  if (!tab) {
    throw new Error(`LFF fixtures URL is missing a "tab" query parameter: ${url}`);
  }
  return `tab${tab}`;
}

export async function scrapeFixtures(url: string): Promise<ScrapedFixture[]> {
  const tabId = tabIdFromUrl(url);

  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FKOlaineSite/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch LFF fixtures: ${res.status}`);
  }

  const $ = cheerio.load(await res.text());
  const fixtures: ScrapedFixture[] = [];

  $(`#${tabId} .tr.match`).each((_, el) => {
    const $el = $(el);
    const clubEls = $el.find(".club");
    if (clubEls.length < 2) return;

    const clubNames = clubEls
      .map((_, club) => $(club).find(".title a").text().trim())
      .get();
    const scores = $el
      .find(".result span")
      .map((_, s) => $(s).text().trim())
      .get();

    const [home, away] = clubNames;
    const [homeScore, awayScore] = scores;
    const played = homeScore !== "-" && awayScore !== "-";

    const day = $el.find(".date h5").text().trim();
    const monthAbbr = $el.find(".date h6").text().trim().toLowerCase();
    const timeText = $el.find(".date .h7").text().trim();
    const year = $el.find(".date .h8").text().trim();
    const month = MONTHS[monthAbbr] ?? 0;

    const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})$/);
    const time = timeMatch ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}` : null;

    fixtures.push({
      date: `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`,
      time,
      home,
      away,
      stadium: $el.find(".stadium").text().trim(),
      played,
    });
  });

  return fixtures;
}
```

- [ ] **Step 2: Remove the live-fixture pipeline from the calendar**

In `src/lib/calendar.ts`:

Remove this import line entirely:
```ts
import { getAllFixtures, type Fixture } from "./fixtures";
import type { Competition } from "./standings";
```

Replace the `CalendarEvent` type (drop the `source` field and its comment):
```ts
export type CalendarEvent = {
  uid: string;
  title: string;
  location: string | null;
  allDay: boolean;
  start: Date;
  end: Date;
  /** Riga-local calendar date, e.g. "2026-09-07" — timezone-safe grouping key. */
  dateKey: string;
  weekdayLabel: string;
  dateLabel: string;
  timeLabel: string | null;
  dayLabel: string;
  monthLabel: string;
  /** What kind of event this is, for at-a-glance color/icon coding. */
  eventType: "game" | "training" | "other";
};
```

Add `export` to `toDateKey` (it's now consumed by `hero.tsx`):
```ts
export function toDateKey(date: Date): string {
```

Delete the `fixtureToCalendarEvent` function and the `getClubFixtureEvents` function entirely (everything from `function fixtureToCalendarEvent` through the end of `getClubFixtureEvents`'s closing brace).

Remove the now-nonexistent `source: "calendar",` line from `getAdminTrainingEvents`, `getAdminEvents`, and `getAdminGameEvents` (three occurrences — each function currently has one, inside the object it returns from `.map()`).

Replace `getScheduleForWeekBrowsing`:
```ts
/** Merges FK Olaine's admin-managed trainings, events, and games for the
 *  week-browsing calendar widget. */
export async function getScheduleForWeekBrowsing(): Promise<CalendarEvent[]> {
  const { after, before } = weekBrowsingWindow();

  const [trainingEvents, otherEvents, gameEvents] = await Promise.all([
    getAdminTrainingEvents(after, before).catch(() => []),
    getAdminEvents(after, before).catch(() => []),
    getAdminGameEvents(after, before).catch(() => []),
  ]);

  return [...trainingEvents, ...otherEvents, ...gameEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}
```

- [ ] **Step 3: Rewire the homepage "next match" widget to the database**

Replace the full contents of `src/components/hero.tsx`:

```tsx
import { gte } from "drizzle-orm";

import { db } from "@/db/client";
import { games } from "@/db/schema";
import { toDateKey } from "@/lib/calendar";
import { getStandings, type StandingRow } from "@/lib/standings";
import { isOlaine, type Team, type UpcomingGame } from "@/lib/games";
import { LeagueSelector } from "@/components/league-selector";
import { MatchesShowcase } from "@/components/matches-showcase";
import { WideScreenFillers } from "@/components/wide-screen-fillers";

const FALLBACK_STANDINGS: StandingRow[] = [
  {
    pos: 1,
    team: "RFS Women",
    logo: null,
    played: 17,
    wins: 15,
    draws: 0,
    losses: 2,
    goalsFor: 98,
    goalsAgainst: 10,
    goalDiff: 88,
    points: 45,
    isOlaine: false,
  },
  {
    pos: 4,
    team: "FK Iecava/FK Olaine",
    logo: null,
    played: 17,
    wins: 7,
    draws: 0,
    losses: 10,
    goalsFor: 49,
    goalsAgainst: 55,
    goalDiff: -6,
    points: 21,
    isOlaine: true,
  },
];

const FALLBACK_UPCOMING_GAMES: UpcomingGame[] = [
  {
    day: "07",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "16:00",
    home: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    away: { name: "RFS Women", initials: "RFS", color: "bg-[#173f8a]" },
    venue: "RFS stadions",
    league: "Sieviešu līga",
  },
  {
    day: "14",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "14:00",
    home: { name: "Liepājas FS", initials: "LFS", color: "bg-[#167c4c]" },
    away: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    venue: "Liepājas stadions",
    league: "Sieviešu līga",
  },
  {
    day: "21",
    month: "SEP",
    year: "2026",
    weekday: "PIRMD.",
    time: "15:00",
    home: { name: "FK Olaine", logo: "/fk-olaine-crest-v2.png" },
    away: {
      name: "Riga FC Women",
      initials: "RFC",
      color: "bg-[#1687c9]",
    },
    venue: "Olaines stadions",
    league: "Sieviešu līga",
  },
];

const WEEKDAY_ABBR: Record<string, string> = {
  pirmdiena: "PIRMD.",
  otrdiena: "OTRD.",
  trešdiena: "TREŠD.",
  ceturtdiena: "CETURTD.",
  piektdiena: "PIEKTD.",
  sestdiena: "SESTD.",
  svētdiena: "SVĒTD.",
};

const MONTHS = [
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

const FALLBACK_TEAM_COLORS = [
  "bg-club-navy",
  "bg-club-red",
  "bg-[#167c4c]",
  "bg-[#1687c9]",
  "bg-[#7c3aed]",
];

function initialsFor(name: string) {
  return name
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % FALLBACK_TEAM_COLORS.length;
  }
  return FALLBACK_TEAM_COLORS[hash];
}

function teamDisplay(name: string): Team {
  return isOlaine(name)
    ? { name, logo: "/fk-olaine-crest-v2.png" }
    : { name, initials: initialsFor(name), color: colorFor(name) };
}

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

async function fetchStandings(
  competition: Parameters<typeof getStandings>[0],
  fallback: StandingRow[] = [],
): Promise<StandingRow[]> {
  try {
    return await getStandings(competition);
  } catch {
    return fallback;
  }
}

async function fetchUpcomingGames(): Promise<UpcomingGame[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select()
      .from(games)
      .where(gte(games.date, todayKey))
      .orderBy(games.date, games.startTime)
      .limit(5);

    if (rows.length === 0) return FALLBACK_UPCOMING_GAMES;

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      return {
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        weekday: weekdayAbbrFor(row.date),
        time: row.startTime,
        league: row.league ?? "Draudzības spēle",
        home: teamDisplay(row.homeTeam),
        away: teamDisplay(row.awayTeam),
        venue: row.location,
      };
    });
  } catch {
    return FALLBACK_UPCOMING_GAMES;
  }
}

export async function Hero() {
  const [sieviesuLiga, liga1, u16, upcomingGames] = await Promise.all([
    fetchStandings("sieviesu-liga", FALLBACK_STANDINGS),
    fetchStandings("1-liga"),
    fetchStandings("u16"),
    fetchUpcomingGames(),
  ]);

  return (
    <section className="px-6 pt-2 pb-3 sm:pt-3">
      <div className="relative mx-auto max-w-[1440px]">
        <WideScreenFillers />

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left column: full-height matches showcase */}
          <MatchesShowcase games={upcomingGames} />

          {/* League table card */}
          <div className="relative flex h-[640px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-background shadow-sm">
            <LeagueSelector leagues={[sieviesuLiga, liga1, u16]} />
          </div>
        </div>
      </div>
    </section>
  );
}
```

(`day: String(day).padStart(2, "0")` matches the old zero-padded display; `month`/`year` come straight from the `"YYYY-MM-DD"` date key instead of being regex-parsed out of a display string.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors — this confirms `fixtures.ts`'s old exports (`getAllFixtures`, `getUpcomingFixtures`, `Fixture`) are no longer referenced anywhere.

With the dev server running, visit `/` — the "next match" widget should show the `FALLBACK_UPCOMING_GAMES` (since no games exist in the DB yet at this point in the plan), and the league standings table should still show real live data from lff.lv exactly as before. Visit `/` and scroll to the calendar — it should show no league fixtures (none imported yet) but still show any trainings/events/manual games entered so far.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fixtures.ts src/lib/calendar.ts src/components/hero.tsx
git commit -m "feat: generalize LFF fixture scraper, drop live-fixture pipeline from calendar and homepage"
```

---

### Task 3: League sources admin CRUD

**Files:**
- Create: `src/db/schema.ts` — modify, add `leagueSources` table + relation
- Create: `src/app/admin/(protected)/league-sources/actions.ts`
- Create: `src/app/admin/(protected)/league-sources/page.tsx`
- Create: `src/app/admin/(protected)/league-sources/[id]/page.tsx`
- Create: `src/app/admin/(protected)/league-sources/[id]/league-source-form.tsx`
- Modify: `src/app/admin/(protected)/layout.tsx`

**Interfaces:**
- Consumes: `db`, `teams` (existing); `DeleteButton` (existing).
- Produces: `leagueSources` table `{ id, teamId, label, url, createdAt }`, consumed by Task 4's import screen. `createLeagueSource`, `updateLeagueSource`, `deleteLeagueSource` Server Actions.

- [ ] **Step 1: Add the `league_sources` table to the schema**

In `src/db/schema.ts`, add after the `games` table definition:

```ts
export const leagueSources = sqliteTable("league_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  createdAt: integer("created_at").notNull(),
});
```

Add `leagueSources: many(leagueSources)` to `teamsRelations`:

```ts
export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  coachTeams: many(coachTeams),
  trainings: many(trainings),
  events: many(events),
  games: many(games),
  leagueSources: many(leagueSources),
}));
```

Add a relation for the new table, after `coachTeamsRelations`:

```ts
export const leagueSourcesRelations = relations(leagueSources, ({ one }) => ({
  team: one(teams, { fields: [leagueSources.teamId], references: [teams.id] }),
}));
```

- [ ] **Step 2: Write the Server Actions**

Create `src/app/admin/(protected)/league-sources/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";

function parseLeagueSourceInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!label) return { error: "Nosaukums ir obligāts." } as const;
  if (!url) return { error: "URL ir obligāts." } as const;

  try {
    new URL(url);
  } catch {
    return { error: "Nederīgs URL." } as const;
  }

  return { teamId, label, url } as const;
}

export async function createLeagueSource(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseLeagueSourceInput(formData);
  if ("error" in parsed) return parsed;

  await db.insert(leagueSources).values({ ...parsed, createdAt: Date.now() });
  revalidatePath("/admin/league-sources");
  redirect("/admin/league-sources");
}

export async function updateLeagueSource(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const parsed = parseLeagueSourceInput(formData);
  if ("error" in parsed) return parsed;

  await db.update(leagueSources).set(parsed).where(eq(leagueSources.id, id));
  revalidatePath("/admin/league-sources");
  redirect("/admin/league-sources");
}

export async function deleteLeagueSource(id: number) {
  await db.delete(leagueSources).where(eq(leagueSources.id, id));
  revalidatePath("/admin/league-sources");
}
```

- [ ] **Step 3: Write the list page**

Create `src/app/admin/(protected)/league-sources/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { db } from "@/db/client";
import { leagueSources, teams } from "@/db/schema";

import { deleteLeagueSource } from "./actions";

export default async function AdminLeagueSourcesPage() {
  const rows = await db
    .select({
      id: leagueSources.id,
      label: leagueSources.label,
      url: leagueSources.url,
      teamName: teams.name,
    })
    .from(leagueSources)
    .innerJoin(teams, eq(leagueSources.teamId, teams.id))
    .orderBy(leagueSources.label);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Līgu avoti</h1>
        <Link
          href="/admin/league-sources/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4 font-semibold">URL</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((source) => (
            <tr key={source.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{source.label}</td>
              <td className="p-4 text-slate-500">{source.teamName}</td>
              <td className="max-w-xs truncate p-4 text-slate-500">{source.url}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/league-sources/${source.id}/import`}
                    className="text-sm font-semibold text-club-red hover:underline"
                  >
                    Ielādēt spēles
                  </Link>
                  <Link
                    href={`/admin/league-sources/${source.id}`}
                    className="text-sm font-semibold text-club-navy hover:underline"
                  >
                    Rediģēt
                  </Link>
                  <DeleteButton
                    action={deleteLeagueSource.bind(null, source.id)}
                    confirmMessage={`Dzēst līgas avotu "${source.label}"?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-slate-400">
                Vēl nav neviena līgas avota.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Write the create/edit form**

Create `src/app/admin/(protected)/league-sources/[id]/league-source-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";

import { createLeagueSource, updateLeagueSource } from "../actions";

type LeagueSource = { id: number; teamId: number; label: string; url: string };
type TeamOption = { id: number; name: string };

export function LeagueSourceForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; source: LeagueSource; teamOptions: TeamOption[] },
) {
  const action =
    props.mode === "create" ? createLeagueSource : updateLeagueSource.bind(null, props.source.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const source = props.mode === "edit" ? props.source : null;

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns līgas avots" : "Rediģēt līgas avotu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Nosaukums
        <input
          type="text"
          name="label"
          required
          placeholder="Sieviešu līga"
          defaultValue={source?.label ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={source?.teamId ?? ""}
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
        LFF spēļu saraksta URL
        <input
          type="url"
          name="url"
          required
          placeholder="https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_2"
          defaultValue={source?.url ?? ""}
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

Create `src/app/admin/(protected)/league-sources/[id]/page.tsx`:

```tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources, teams } from "@/db/schema";

import { LeagueSourceForm } from "./league-source-form";

export default async function AdminLeagueSourceFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = await db.select().from(teams).orderBy(teams.name);

  if (id === "new") {
    return <LeagueSourceForm mode="create" teamOptions={teamOptions} />;
  }

  const sourceId = Number(id);
  const [source] = await db.select().from(leagueSources).where(eq(leagueSources.id, sourceId));
  if (!source) notFound();

  return <LeagueSourceForm mode="edit" source={source} teamOptions={teamOptions} />;
}
```

- [ ] **Step 5: Add the nav item**

In `src/app/admin/(protected)/layout.tsx`, add a new entry to `NAV_ITEMS` right after `"Spēles"`:

```ts
const NAV_ITEMS = [
  { href: "/admin/teams", label: "Komandas" },
  { href: "/admin/players", label: "Spēlētāji" },
  { href: "/admin/coaches", label: "Treneri" },
  { href: "/admin/trainings", label: "Treniņi" },
  { href: "/admin/events", label: "Notikumi" },
  { href: "/admin/games", label: "Spēles" },
  { href: "/admin/league-sources", label: "Līgu avoti" },
];
```

- [ ] **Step 6: Push the schema**

Run:
```bash
npm run db:push -- --force
```
Expected: `Changes applied` (adds the new `league_sources` table; existing tables are untouched since this step only adds a table, no column changes).

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With the dev server running (restart if needed), visit `/admin/league-sources`: create a source with label "Sieviešu līga", team "1. komanda", and URL `https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_2`. Confirm it appears in the list. Edit its label, confirm the list updates. Leave it in place — Task 4's test needs at least one source to exist.

- [ ] **Step 8: Commit**

```bash
git add src/db/schema.ts "src/app/admin/(protected)/league-sources" "src/app/admin/(protected)/layout.tsx"
git commit -m "feat: add league sources admin CRUD"
```

---

### Task 4: Fetch, preview, and confirm import screen

**Files:**
- Create: `src/app/admin/(protected)/league-sources/[id]/import/actions.ts`
- Create: `src/app/admin/(protected)/league-sources/[id]/import/page.tsx`

**Interfaces:**
- Consumes: `scrapeFixtures` (Task 2); `db`, `games`, `leagueSources` (Tasks 1 & 3); `isOlaine` from `@/lib/games` (existing).
- Produces: nothing consumed elsewhere — this is the final task.

- [ ] **Step 1: Write the confirm Server Action**

Create `src/app/admin/(protected)/league-sources/[id]/import/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { games } from "@/db/schema";

type SelectedFixture = {
  homeTeam: string;
  awayTeam: string;
  date: string;
  startTime: string;
  location: string;
};

function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const wrappedHour = Math.floor(total / 60) % 24;
  const remMinute = total % 60;
  return `${String(wrappedHour).padStart(2, "0")}:${String(remMinute).padStart(2, "0")}`;
}

export async function confirmImport(teamId: number, league: string, formData: FormData) {
  const selections = formData
    .getAll("selected")
    .map((value) => JSON.parse(String(value)) as SelectedFixture);

  if (selections.length > 0) {
    await db.insert(games).values(
      selections.map((fixture) => ({
        teamId,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        date: fixture.date,
        startTime: fixture.startTime,
        endTime: addMinutes(fixture.startTime, 90),
        location: fixture.location,
        source: "lff" as const,
        league,
        createdAt: Date.now(),
      })),
    );
  }

  revalidatePath("/admin/games");
  redirect("/admin/games");
}
```

(`endTime` is always start + 90 minutes — LFF's fixtures page doesn't publish a scheduled match length.)

- [ ] **Step 2: Write the import screen**

Create `src/app/admin/(protected)/league-sources/[id]/import/page.tsx`:

```tsx
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { games, leagueSources } from "@/db/schema";
import { scrapeFixtures } from "@/lib/fixtures";
import { isOlaine } from "@/lib/games";

import { confirmImport } from "./actions";

export default async function AdminLeagueSourceImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sourceId = Number(id);

  const [source] = await db.select().from(leagueSources).where(eq(leagueSources.id, sourceId));
  if (!source) notFound();

  const fixtures = await scrapeFixtures(source.url);
  const candidates = fixtures.filter(
    (fixture) => fixture.time !== null && (isOlaine(fixture.home) || isOlaine(fixture.away)),
  );

  const existingGames = await db
    .select({ date: games.date, homeTeam: games.homeTeam, awayTeam: games.awayTeam })
    .from(games)
    .where(and(eq(games.teamId, source.teamId), eq(games.source, "lff")));

  const existingKeys = new Set(existingGames.map((g) => `${g.date}|${g.homeTeam}|${g.awayTeam}`));

  const rows = candidates.map((fixture) => ({
    fixture,
    alreadyImported: existingKeys.has(`${fixture.date}|${fixture.home}|${fixture.away}`),
  }));

  const boundConfirm = confirmImport.bind(null, source.teamId, source.label);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
        Ielādēt spēles: {source.label}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Atrastas {candidates.length} FK Olaine spēles. Atzīmē, kuras pievienot, un apstiprini.
      </p>

      {candidates.length === 0 ? (
        <p className="text-sm text-slate-400">
          Šajā URL neizdevās atrast nevienu FK Olaine spēli ar apstiprinātu laiku.
        </p>
      ) : (
        <form action={boundConfirm}>
          <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="p-4" />
                <th className="p-4 font-semibold">Datums</th>
                <th className="p-4 font-semibold">Laiks</th>
                <th className="p-4 font-semibold">Mājinieki</th>
                <th className="p-4 font-semibold">Viesi</th>
                <th className="p-4 font-semibold">Stadions</th>
                <th className="p-4 font-semibold">Statuss</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ fixture, alreadyImported }, index) => (
                <tr key={index} className="border-b border-slate-100 last:border-0">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      name="selected"
                      disabled={alreadyImported}
                      defaultChecked={!alreadyImported}
                      value={JSON.stringify({
                        homeTeam: fixture.home,
                        awayTeam: fixture.away,
                        date: fixture.date,
                        startTime: fixture.time,
                        location: fixture.stadium || "Nav norādīts",
                      })}
                    />
                  </td>
                  <td className="p-4 text-club-navy">{fixture.date}</td>
                  <td className="p-4 text-slate-500">{fixture.time}</td>
                  <td className="p-4 text-slate-500">{fixture.home}</td>
                  <td className="p-4 text-slate-500">{fixture.away}</td>
                  <td className="p-4 text-slate-500">{fixture.stadium || "—"}</td>
                  <td className="p-4 text-slate-500">
                    {alreadyImported ? "jau importēts" : fixture.played ? "aizvadīta" : "gaidāma"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="submit"
            className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
          >
            Apstiprināt
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With the dev server running and the "Sieviešu līga" source from Task 3 still in place, visit `/admin/league-sources`, click "Ielādēt spēles" on it. Expected: a table of FK Olaine's fixtures from that competition, each pre-checked. Uncheck a couple, click "Apstiprināt". Confirm you land on `/admin/games` and see exactly the games you left checked, each showing "Sieviešu līga" as its competition and `source: "lff"` (verify the latter directly against the database, since it isn't shown in the admin UI):

```bash
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./local.db' });
(async () => {
  const r = await client.execute('select home_team, away_team, source, league from games');
  console.log(r.rows);
})();
"
```

Expected: every imported row has `source: 'lff'` and `league: 'Sieviešu līga'`.

Go back to `/admin/league-sources`, click "Ielādēt spēles" on the same source again. Expected: the fixtures you already imported now show as "jau importēts" with a disabled, unchecked checkbox; any fixtures you left unchecked the first time now show as available to import again.

Visit `/` (homepage) — the "next match" widget should now show the soonest of your imported games (or a manually-entered friendly, whichever comes first chronologically), and the homepage calendar should show it too.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/league-sources/[id]/import"
git commit -m "feat: add LFF fixture fetch, preview, and confirm import screen"
```

---

## Post-plan note for deployment

Before deploying, after running `npm run db:push` against production credentials: visit `/admin/league-sources`, add the club's active league(s) (URL + mapped team), and run "Ielādēt spēles" on each at least once, so the homepage and calendar aren't empty of league fixtures on first load. This mirrors the existing `npm run db:seed` bootstrapping step for team/player/coach data — it's a one-time, manual setup action, not part of the app's request path.
