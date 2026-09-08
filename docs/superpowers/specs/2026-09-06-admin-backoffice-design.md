# FK Olaine Admin Backoffice — Design

Date: 2026-09-06 (revised 2026-09-08)

## Revision note

This spec was written 2026-09-06 and never implemented. In the meantime,
real public pages were built for Teams (`/komandas`) and Coaches
(`/treneri`) with hardcoded data, and a **recurring weekly training
generator** was added to `src/lib/calendar.ts` — built without knowledge
of this spec, and in direct conflict with it (this spec always intended
every training session to be its own dated database row). This revision:

- Reconciles `Team`, `Player`, and `Coach` to the fields those live pages
  actually use (dropping fields the original draft invented — `category`,
  `shirtNumber`, `position` on Player, `bio`, `primaryTeamId` — that were
  never built and aren't needed).
- Confirms the **full replacement** direction: the recurring generator in
  `lib/calendar.ts` is deleted; every training becomes an admin-managed
  dated row, as originally speced.
- Adds a generic `Event` entity for the calendar's existing "Cits" (other)
  bucket, which the original draft had no entity for.
- Changes `Coach`↔`Team` from a single nullable FK to a many-to-many join
  table — real coaches (e.g. the goalkeeping coach) lead more than one
  team.

## Overview

FK Olaine's site currently has no persistent data store: it either scrapes
lff.lv live (league standings, official fixtures) or falls back to
hardcoded arrays in component files. This project adds the site's first
database and a password-protected `/admin` area where a club admin can
manage club-internal data that has no official external source:

- Teams
- Players
- Coaches
- Trainings (individual dated sessions — replaces the hardcoded recurring
  schedule)
- Events (one-off, non-training, non-league items — the calendar's "Cits"
  category: team meetings, tournaments, holidays, etc.)
- Games (non-league only — friendlies, cup matches; official league
  fixtures/standings keep coming live from lff.lv, unchanged)

This project is **admin CRUD plus wiring the public pages to read from
the database**: `/komandas` and `/treneri` switch from their hardcoded
arrays to live queries, and `src/lib/calendar.ts` switches from the
recurring generator to querying `Training`/`Event` rows. This is a
necessary part of the project, not a follow-up — an admin panel that
edits data nothing displays isn't useful yet.

## Goals

- Admin can log in and create/edit/delete records for all six entities
  above.
- `/komandas`, `/treneri`, and the homepage calendar render this data
  live instead of from hardcoded arrays.
- Data survives restarts and deploys (real persistence, not in-memory).
- Fits the existing codebase's conventions: Next.js App Router, Tailwind
  v4, the shadcn "base-nova" component style already installed
  (`src/components/ui/*`), TypeScript throughout.
- Works on whatever host this app is deployed to (serverless-compatible —
  no reliance on local filesystem writes persisting between requests).

## Non-goals

- No replacement of the lff.lv scraping for official league
  standings/fixtures.
- No image upload pipeline — photo fields are plain URL text inputs, same
  as today's hardcoded `/public` image paths.
- No multi-user accounts, roles, or permissions — one shared admin
  password.
- No recurring/repeating training schedules — every session is its own
  dated row. (This was already the intent in the original draft; it's
  restated here because it's the point this revision corrects course on.)

## Architecture

### Stack

- **Database**: [Turso](https://turso.tech) (hosted libSQL, SQLite-compatible,
  serverless-friendly).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team) with `drizzle-orm/libsql`
  — typed schema, typed queries, SQL-shaped migrations via `drizzle-kit`.
- **Auth**: a single admin password stored in an environment variable
  (`ADMIN_PASSWORD`). Logging in sets a signed, HTTP-only session cookie
  (using a small HMAC-signed token — no separate auth library needed for
  a single shared credential). `middleware.ts` guards every `/admin/*`
  route except `/admin/login` and redirects unauthenticated requests
  there.
- **UI/mutations**: React Server Components fetch data directly via
  Drizzle for list/detail views, and for the public `/komandas`,
  `/treneri`, and calendar reads. Create/update/delete go through Server
  Actions (`"use server"` functions colocated with each entity's admin
  pages), which call `revalidatePath` on success so both the admin list
  view and the corresponding public page refresh. No REST API routes are
  introduced.

### New dependencies

```
drizzle-orm
@libsql/client
drizzle-kit         (dev dependency, for migrations)
```

### Environment variables

```
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
ADMIN_PASSWORD
SESSION_SECRET       (random string, used to sign the session cookie)
```

### File layout

```
src/
  db/
    schema.ts          Drizzle table definitions
    client.ts           libSQL client + drizzle() instance
  lib/
    auth.ts             session cookie sign/verify, login/logout helpers
    calendar.ts          rewritten: Training/Event rows + Game (fixture)
                          rows merged into CalendarEvent, no more
                          recurring generator
  app/
    admin/
      login/
        page.tsx         login form
        actions.ts        login server action
      layout.tsx         admin shell: nav (Teams/Players/Coaches/Trainings/Events/Games), logout button
      teams/
        page.tsx          list
        actions.ts        create/update/delete
        [id]/page.tsx      edit form (new uses a literal "new" id)
      players/            (same shape)
      coaches/            (same shape; team assignment is a multi-select)
      trainings/          (same shape)
      events/             (same shape)
      games/              (same shape)
  middleware.ts          guards /admin/*, excludes /admin/login
drizzle.config.ts
drizzle/                 generated SQL migrations
```

Each entity's `page.tsx`, `actions.ts`, and `[id]/page.tsx` follow an
identical shape, so once Teams is built the others are mostly
copy-and-adjust-fields.

## Data model

```
Team
  id            integer primary key
  name          text, required, unique     e.g. "1. komanda", "U16", "Vārtsargu grupa"
  createdAt     integer (unix ms)

Player
  id            integer primary key
  teamId        integer, FK -> Team.id, required
  name          text, required             full name, one field (matches the site)
  birthdate     text, required             "DD.MM.YYYY." (matches the site's display format)
  photoUrl      text, nullable
  createdAt     integer (unix ms)

Coach
  id            integer primary key
  name          text, required
  position      text, required             e.g. "Galvenais treneris", "Vārtsargu treneris"
  license       text, required             e.g. "UEFA A licence"
  authority     text, required             "UEFA" | "LFF" — which logo to show
  photoUrl      text, nullable
  createdAt     integer (unix ms)

CoachTeam                                   (join table — a coach can lead more than one team)
  coachId       integer, FK -> Coach.id
  teamId        integer, FK -> Team.id
  primary key (coachId, teamId)

Training
  id            integer primary key
  teamId        integer, FK -> Team.id, required
  date          text, required             ISO date string
  startTime     text, required             "HH:MM"
  endTime       text, nullable             "HH:MM"
  location      text, required
  notes         text, nullable
  createdAt     integer (unix ms)

Event                                       (the calendar's "Cits" bucket)
  id            integer primary key
  teamId        integer, FK -> Team.id, nullable   (null = club-wide)
  title         text, required
  date          text, required             ISO date string
  startTime     text, nullable             "HH:MM" (null = all-day)
  endTime       text, nullable             "HH:MM"
  location      text, nullable
  notes         text, nullable
  createdAt     integer (unix ms)

Game
  id            integer primary key
  teamId        integer, FK -> Team.id, required
  opponent      text, required
  date          text, required             ISO date string
  time          text, nullable             "HH:MM"
  homeAway      text, required             "home" | "away"
  location      text, nullable
  notes         text, nullable
  createdAt     integer (unix ms)
```

Deleting a Team cascades to its Players, CoachTeam rows, Trainings,
Events, and Games (they only make sense attached to a team) — a Coach
record itself is untouched, it just loses that team assignment.
Deleting a Coach cascades only to that coach's CoachTeam rows; Teams and
everything else attached to them are untouched.

## Public-page wiring

- `/komandas` (`TeamsDirectory`): the hardcoded `TEAMS` array is replaced
  by a Drizzle query joining `Team` → `Player`, grouped the same way the
  page already groups them. Rendering and styling are unchanged.
- `/treneri` (`CoachesDirectory`): the hardcoded `COACHES` array is
  replaced by a Drizzle query joining `Coach` → `CoachTeam` → `Team` to
  build each coach's `teams: string[]`. Rendering and styling are
  unchanged.
- `src/lib/calendar.ts`: `generateTrainingEvents()` and
  `TRAINING_SCHEDULE` are deleted. `getScheduleForWeekBrowsing()` instead
  queries `Training`, `Event`, and the existing scraped `Game`/fixture
  data for the browsing window and maps each to the same `CalendarEvent`
  shape the UI already consumes — `WeekCalendar` and the rest of the
  calendar UI need no changes. Non-league `Game` rows get `eventType:
  "game"` and `source: "calendar"` (to distinguish them from scraped
  league fixtures, which stay `source: "fixture"`); `Event` rows get
  `eventType: "other"`.

## Admin UI

- `/admin/login` — single password field, submits to a Server Action
  that checks it against `ADMIN_PASSWORD` and sets the session cookie on
  success, otherwise re-renders the form with an error.
- `/admin` (root) redirects to `/admin/teams`.
- Shared layout: left-hand nav with the six sections, a logout button
  (clears the cookie), plain white/navy styling consistent with the
  public site's palette (reusing `text-club-navy`, `bg-club-red` etc. from
  `globals.css`) but simple/utilitarian — this is an internal tool, not a
  marketing page.
- Each list page: a table of existing rows (name/key fields + edit/delete
  actions), a "+ Add" button linking to the create form. Player/Training/
  Event/Game lists show their parent team's name and support filtering by
  team via a query param.
- Coach create/edit form: team assignment is a multi-select (checkboxes)
  over the current `Team` list, writing/replacing that coach's
  `CoachTeam` rows on save.
- Each create/edit page: a plain form (native `<form action={...}>` wired
  to the Server Action), shadcn `Button`/`Input`-style fields, inline
  validation errors returned from the action.
- Delete: a button that calls a Server Action directly (with a native
  `confirm()`-style guard via a small client component wrapper, since
  Server Actions can't show a confirm dialog themselves).

## Error handling

- Server Actions validate input server-side (required fields, correct
  types) using simple manual checks — no new validation library needed
  for forms this small — and return `{ error: string }` on failure rather
  than throwing, so the page can re-render the form with the message.
- DB/network failures surface as a generic "Something went wrong, try
  again" message; details are logged server-side via `console.error`.
  Public pages (`/komandas`, `/treneri`, calendar) fall back to an empty
  list on query failure rather than crashing, matching how they already
  handle the LFF scrape failing.
- Middleware redirects to `/admin/login` on any missing/invalid session
  cookie, including expired ones.

## Testing approach

- No existing test setup in this repo (no test runner installed). Given
  the scope, this project relies on manual verification of each CRUD
  flow (create/edit/delete for all six entities, login/logout, the
  unauthenticated-redirect behavior, and that each public page/calendar
  reflects admin changes after a refresh) rather than introducing a
  testing framework as a side effect. Adding automated tests is a
  reasonable future project but is out of scope here.

## Deployment

- Requires a Turso database to be provisioned (account + `turso db
  create`) and its URL/token added to the host's environment variables,
  plus `ADMIN_PASSWORD` and `SESSION_SECRET`.
- `drizzle-kit push` (or generated migrations) applies the schema to the
  Turso database as part of setup; this is a manual one-time/per-change
  step, not part of the app's request path.
- First deploy needs the six tables seeded with today's hardcoded data
  (current `TEAMS`/`COACHES` arrays and the training schedule) so the
  public pages don't go blank the moment this ships — a one-off seed
  script, not an ongoing part of the app.

## Out of scope (explicitly deferred)

- Multi-user accounts/roles.
- Image upload pipeline.
- Recurring training schedules.
- Admin management of league games/standings (stays scraped).
