# LFF League Game Import — Design

**Status:** Approved by user, 2026-09-08.

## Motivation

Today, official league fixtures (Sieviešu līga, 1. līga, U16) are fetched live from lff.lv on every page load, in three places: the homepage hero's "next match" widget, the homepage league standings table, and the homepage calendar. Nothing is stored in the database. Meanwhile, the admin backoffice built earlier this session added a `games` table for manually-entered "non-league" games only (friendlies, cup games) — official league games were explicitly out of scope for it, on the assumption they'd always come from the live pipeline.

This design replaces that assumption: an admin screen lets the admin fetch official league fixtures from an LFF URL, review them, and confirm which ones get written into the database. This also makes it possible to track a league that isn't one of the 3 currently hardcoded ones — the admin just adds a new "league source" pointing at its LFF URL.

**Standings are explicitly out of scope.** The full league points table (every team's wins/draws/losses/points) is a separate scrape from fixtures and isn't derivable from FK Olaine's own games. It stays exactly as it is today: live-fetched via `src/lib/standings.ts`, untouched by this work.

## Data model

### New table: `league_sources`

The admin-managed list of import sources — one row per competition/league the admin wants to be able to import fixtures from.

```
leagueSources: {
  id: integer, primary key, autoincrement
  teamId: integer, FK -> teams.id, required, onDelete: cascade
  label: text, required          // e.g. "Sieviešu līga" — shown everywhere this game's league is displayed
  url: text, required            // the LFF fixtures page URL, e.g. "https://lff.lv/sacensibas/sievietes/sieviesu-futbola-liga/?tab=content_1_2"
  createdAt: integer, required
}
```

`teamId` says which of the club's internal squads (from the existing `teams` table) plays in this competition — e.g. "Sieviešu līga" and "1. līga" might both map to "1. komanda", while "U16" maps to the "U16" team.

### `games` table changes

```diff
 games: {
   id, teamId (FK -> teams, required, onDelete: cascade),
-  opponent: text, required,
+  homeTeam: text, required,
+  awayTeam: text, required,
   date: text, required,
   startTime: text, required,
   endTime: text, required,
-  homeAway: "home" | "away", required,
   location: text, required,
   notes: text, nullable,
+  source: "manual" | "lff", required, default "manual",
+  league: text, nullable,       // e.g. "Sieviešu līga"; null for manual/friendly games
   createdAt: integer, required,
 }
```

`homeTeam`/`awayTeam` replace `opponent`/`homeAway` — both store the actual club names for each side (e.g. `homeTeam: "FK Ventspils"`, `awayTeam: "FK Olaine"`). This matches scraped fixture data directly (which already gives both full names) and works fine for manual entry (admin types both names). Which side is "FK Olaine" is determined at render time by testing each name against `/olaine/i`, exactly like the existing fixture-scraping code already does for `isOlaine`.

`source` distinguishes admin-typed friendlies (`"manual"`) from LFF-imported official games (`"lff"`) — used only for the import screen's "already imported" dedup check (matching on `teamId` + `date` + `homeTeam` + `awayTeam`) and isn't otherwise admin-editable; it's set automatically by whichever flow creates the row.

`league` holds the competition label (copied from the league source's `label` at import time). It's `null` for manually-entered games, which the UI shows as "Draudzības spēle" (friendly match) wherever a league label would otherwise appear.

## Scraping layer

`src/lib/fixtures.ts` is rewritten to drop its hardcoded `Competition`-keyed config (`FIXTURES_CONFIG`, the `Competition` import, `LEAGUE_LABELS`) in favor of a single function that takes a raw URL:

```ts
export type ScrapedFixture = {
  date: string;        // "YYYY-MM-DD"
  time: string | null; // "HH:MM" | null if unparseable
  home: string;
  away: string;
  stadium: string;
  played: boolean;
};

export async function scrapeFixtures(url: string): Promise<ScrapedFixture[]>
```

The tab ID needed for the cheerio selector (`#{tabId} .tr.match`) is derived from the URL's own `?tab=` query parameter (`tabId = "tab" + new URL(url).searchParams.get("tab")`) rather than looked up from a hardcoded map — every LFF fixtures URL already carries this parameter, so no separate input is needed from the admin. The row-parsing logic (finding `.club`, `.date h4/h5/h6/.h7/.h8`, `.result span`, `.stadium`) is unchanged from today's `getAllFixtures`. `homeLogo`/`awayLogo`/`weekday`/`league`/`isOlaine`/`sortKey` are dropped from the return shape — they were either LFF-display-only concerns (logos — the site draws its own initials+color avatars for opponents, only FK Olaine gets a real crest, matched by name) or now computed by the caller (`isOlaine`-style filtering happens once, in the import screen, using the same `/olaine/i` test against `home`/`away`).

`standings.ts` (`getStandings`, `StandingRow`, its own separate `Competition` type and `COMPETITIONS` map) is untouched.

`getAllFixtures`, `getUpcomingFixtures`, and the old `Fixture` type are deleted along with the old config, since nothing needs a "give me all fixtures for one of these 3 hardcoded competitions, live" query anymore — the admin import screen calls `scrapeFixtures(url)` directly with whatever URL the league source specifies.

## Admin UI

### League sources CRUD

Same pattern as every other admin entity (Teams, Players, etc.):

- `src/app/admin/(protected)/league-sources/actions.ts` — `createLeagueSource`, `updateLeagueSource`, `deleteLeagueSource`.
- `src/app/admin/(protected)/league-sources/page.tsx` — list: label, mapped team name, a "Ielādēt spēles" (Fetch & Import) link per row (to the import screen below), Rediģēt/Dzēst.
- `src/app/admin/(protected)/league-sources/[id]/page.tsx` + `league-source-form.tsx` — create/edit form: label (text), team (select, from existing teams), URL (text/url input).
- Added to the admin sidebar nav (`src/app/admin/(protected)/layout.tsx`).

### Import screen

`src/app/admin/(protected)/league-sources/[id]/import/page.tsx`:

1. Loads the league source by ID (404 if missing).
2. Calls `scrapeFixtures(source.url)`.
3. Filters to fixtures where `home` or `away` matches `/olaine/i`, **and** `time` is non-null (LFF sometimes leaves a not-yet-scheduled fixture's time blank/unparseable — those are silently excluded from the review list, matching today's behavior in the old `fixtureToCalendarEvent`, which skipped fixtures it couldn't parse a time from). `games.startTime` is a required column, so there's nothing sensible to import until LFF publishes a kickoff time.
4. For each remaining candidate, checks whether a `games` row already exists with the same `teamId` (from the source), `date`, `homeTeam`, and `awayTeam` — call this "already imported".
5. Renders a form: one row per candidate fixture (date, time, home – away, stadium, played/not). New fixtures get a checkbox, pre-checked, whose `value` is the fixture's data JSON-encoded (`{date, startTime, homeTeam, awayTeam, location}`) so the confirm step doesn't need to re-fetch. Already-imported fixtures render as a disabled, unchecked row labeled "jau importēts".
6. A single "Apstiprināt" submit button posts to a Server Action (`confirmImport`, bound to the source's `id`) that reads `formData.getAll("selected")`, JSON-parses each, and inserts one `games` row per selection with `teamId: source.teamId`, `source: "lff"`, `league: source.label`, `endTime` computed as start + 90 minutes (LFF's fixtures page doesn't publish a match's scheduled end time). Redirects to `/admin/games` on success.

### Manual games form changes

`src/app/admin/(protected)/games/[id]/game-form.tsx` and `actions.ts`:

- "Pretinieks" (single opponent text input) + the "Māja/izbraukums" radio fieldset are replaced with two required text inputs, "Mājinieki" (home team) and "Viesi" (away team).
- A new optional text input, "Sacensības (nav obligāts)" (competition/league), sets `league` — left blank, it's `null` and the UI shows "Draudzības spēle".
- `source` is never shown or editable in this form — `createGame`/`updateGame` always write `source: "manual"`.
- The games list page (`src/app/admin/(protected)/games/page.tsx`) updates its columns to show home – away (instead of team/opponent/home-away separately) and the league label (or "Draudzības spēle").

## Public page rewiring

### `src/lib/calendar.ts`

- `getAdminGameEvents` drops its join to `teams` (no longer needed — the title is built directly from `homeTeam`/`awayTeam`, not from the club's own team name) and its `homeAway`-based label branch: `title` becomes simply `` `${row.homeTeam} – ${row.awayTeam}` ``.
- `getClubFixtureEvents` and `fixtureToCalendarEvent` are deleted (no longer any live-fixture pipeline to wrap).
- `CalendarEvent.source` collapses from `"calendar" | "fixture"` to being dropped entirely — nothing renders it (confirmed: no reference in `week-calendar.tsx` or `calendar-section.tsx`), and its only distinction (recurring-schedule vs. live-fixture) no longer exists once everything is DB-backed.
- `getScheduleForWeekBrowsing` no longer calls `getClubFixtureEvents`; it merges `getAdminTrainingEvents`, `getAdminEvents`, `getAdminGameEvents` only.

### `src/components/hero.tsx`

- `fetchUpcomingGames()` is replaced with a DB query: `games` where `date >= today` (Riga-local), ordered by `date`/`startTime`, limited to a handful of rows — mapped into the existing `UpcomingGame` shape. Whichever side's name matches `/olaine/i` renders with the FK Olaine crest (`/fk-olaine-crest-v2.png`); the other side keeps today's initials+generated-color avatar (`initialsFor`/`colorFor`, unchanged). `league` in the mapped `UpcomingGame` is the row's `league` column, or `"Draudzības spēle"` if null.
- `fetchStandings`/`getStandings` and the `FALLBACK_STANDINGS` fallback are untouched.
- `FALLBACK_UPCOMING_GAMES` stays as the empty-state fallback (used when the DB query returns zero upcoming games), unchanged in shape since `UpcomingGame` itself doesn't change.
- Per the earlier scope decision, this widget shows the single next game **regardless of source** — a friendly can be "next match" if it's chronologically soonest.

## Migration and rollout

The local dev database currently has no `games` rows (emptied during earlier verification), so applying these schema changes (`npm run db:push`, adding/removing columns) is lossless in dev. No `league_sources` rows are seeded — the admin sets these up through the new UI after this ships. Until at least one league source is imported, the homepage "next match" widget and calendar show no league games (friendlies still work if any exist) — this is an expected, one-time bootstrapping step for the admin, the same way `npm run db:seed` bootstraps team/player/coach data today.

**Before deploying:** after running `npm run db:push` against production, the admin needs to visit `/admin/league-sources`, add the club's active league(s) (URL + mapped team), and run "Fetch & Import" on each at least once, so the public pages aren't empty of league fixtures on first load.

## Out of scope

- Standings/league table data (stays live-fetched, unchanged).
- Storing match scores/results (nothing currently displays them; can be added later if a "results" feature comes up).
- Auto-refresh/re-sync of already-imported fixtures if LFF changes a kickoff time after import — admin edits the affected `games` row manually via the existing Games CRUD.
- Scraping league name/competition metadata from the LFF page itself — the admin types the `label` when creating a league source.
