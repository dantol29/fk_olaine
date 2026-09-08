# Opponent Club Logos — Design

**Status:** Approved by user, 2026-09-08.

## Motivation

This is the follow-up deferred during the Coach/Player photo upload brainstorm. Opponent club names (`games.homeTeam`/`awayTeam`, e.g. "FK Ventspils") are free text — there's no entity to hang a logo image on. Everywhere a club's name currently renders visually, an opponent without a matching admin-uploaded logo falls back to a generated initials+color badge (already built, e.g. `initialsFor`/`colorFor` in `src/lib/games-server.ts`). This design adds an admin-managed name → logo mapping and wires it into every place a club name currently renders with room for an image: the homepage "next match" widget, the admin games list, and the calendar's expanded event popup.

FK Olaine's own crest is unaffected — the existing `isOlaine` name-matching keeps taking priority over any admin-managed entry, so this table is really "known opponent logos."

**Out of scope:** the calendar's compact weekly-grid cards (`EventCard` in `week-calendar.tsx`) stay plain text — they're too tight on space (single-line-clamp 10-11px text) for a logo without a real redesign, which wasn't asked for. Only the expanded detail popup (opened by clicking an event) gets the logo treatment.

## Data model

```ts
export const clubLogos = sqliteTable("club_logos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // exact match against homeTeam/awayTeam text
  logoUrl: text("logo_url").notNull(),
  createdAt: integer("created_at").notNull(),
});
```

No relation to `teams` — this is keyed purely by the free-text club name as it appears in `games.homeTeam`/`awayTeam`.

## Shared resolver

A new server-only module, `src/lib/club-logos.ts`:

```ts
export async function resolveClubLogos(names: string[]): Promise<Map<string, string | null>>
```

For each unique name in the input: if it matches `isOlaine` (from `src/lib/games.ts`), the map value is the hardcoded crest path (`/fk-olaine-crest-v2.png`); otherwise it's the matching `club_logos.logoUrl` row if one exists, or `null`. One batched query (`inArray`) handles all non-Olaine names at once — no N+1 across a list of games. This single function is the only place the Olaine-priority-then-lookup logic lives; every consumer just asks "what's the logo for this name" and gets a `string | null` back.

## Consumers

### `src/lib/games-server.ts` (homepage "next match" widget + the "Nākamā spēle" article widget — both already share this module)

`initialsFor`, `colorFor`, and `FALLBACK_TEAM_COLORS` move out of this file and into `src/lib/games.ts` (they're pure functions with no server dependency, and `week-calendar.tsx` — a client component — needs them too; `games-server.ts` is marked `"server-only"` and can't be imported client-side).

`getUpcomingGamesFromDb` calls `resolveClubLogos` once with every home/away name in its result batch, and `teamDisplay(name, logo)` simplifies to: return the logo if present, else the initials+color fallback. The `isOlaine` import is no longer needed directly in this file — that check now lives inside `resolveClubLogos`.

### `src/lib/calendar.ts` (calendar events)

`CalendarEvent` gains four new optional fields, populated only by the games source:

```ts
homeTeam?: string;
awayTeam?: string;
homeLogo?: string | null;
awayLogo?: string | null;
```

`getAdminGameEvents` calls `resolveClubLogos` with its batch of home/away names and sets these four fields on each returned event, alongside the existing `title` (which stays as the plain "Home – Away" string, still used as the accessible/fallback text and by non-visual consumers).

### `src/app/admin/(protected)/games/page.tsx` (admin games list)

Each card's home/away names get resolved via one `resolveClubLogos` call for the page's full list, rendered as a small logo (or initials+color badge) next to each name — same visual treatment as the homepage widget, scaled down for a list row.

### `src/components/week-calendar.tsx` (calendar expanded event popup)

When the selected event's `eventType === "game"` and `homeTeam`/`awayTeam` are present, the plain `<h3>{selectedEvent.title}</h3>` is replaced with a home-vs-"VS"-vs-away row (small circular logos or initials+color badges, using `initialsFor`/`colorFor` imported from `@/lib/games` for the fallback — no DB access needed client-side since the logo URL or null was already resolved server-side). Non-game events, and game events somehow missing `homeTeam`/`awayTeam` (shouldn't happen in practice, but the fields are optional), keep the existing plain title.

## Admin UI

New CRUD section, `/admin/club-logos`, following the exact pattern already established for every other admin entity (Teams, League Sources, etc.):

- List page: logo thumbnail, name, edit/delete icon buttons (matching the icon-button convention already adopted across the admin).
- Create/edit form: name (text), photo upload (reusing `saveUploadedPhoto`/`deleteUploadedPhoto` from `src/lib/uploads.ts`, subfolder `"clubs"` — same upload-only pattern as Coach/Player photos, no thumbnail-optional since a club logo entry without an image serves no purpose, so the photo is required on create). `saveUploadedPhoto`'s `subfolder` parameter type widens from `"coaches" | "players"` to `"coaches" | "players" | "clubs"`.
- Deleting a club logo entry deletes its uploaded file too (same pattern as Coach/Player deletion).
- Added to the admin sidebar nav.

## Out of scope

- The calendar's compact weekly-grid event cards — plain text stays, no logo (would need a real redesign of that cramped layout).
- Any change to FK Olaine's own crest handling — `isOlaine` priority is unchanged, this table only ever supplies opponent logos.
- Fuzzy/partial name matching — exact string match only, same as the LFF-import dedup logic elsewhere in this admin. If LFF's scraped name for a club varies slightly between fixtures (unlikely but possible), the admin adds a second `club_logos` row for that variant.
