# FK Olaine combined calendar

FK keeps its database and fetches AFA bookings server-side. AFA data is read-only
and is not inserted into FK's teams, games, trainings, or events tables.

## Configure both deployments

AFA must deploy `/api/shared-calendar` and set `SHARED_CALENDAR_SECRET`.
FK must set `AFA_CALENDAR_URL` to that endpoint and set the same
`SHARED_CALENDAR_SECRET`. Keep the secret out of NEXT_PUBLIC variables.
AFA's SITE_URL must be its own public origin.

## Included

- `/kalendars`: games, trainings and events from both clubs, club/venue filters.
- `/admin/calendar`: same combined calendar with edit links for FK bookings only.
- FK game, training and event forms: same-day venue bookings and overlap warnings.
- AFA entries carry separate IDs and club labels and cannot be edited from FK.
- Fresh requests use a four-second timeout. Missing/failed feeds display warnings.
- Fetch ranges are split into <=366-day chunks to support three calendar years.

Occupancy aliases for Olaines pilsētas stadions live in `stadium-venue.ts`.
Add explicit aliases for equivalent venue names; keep separate pitches distinct.

Warnings are advisory. Bookings remain owned by each club, and simultaneous saves
are not atomically reserved across databases. The public calendar loads current
bookings on each page visit; reload after changes. FK only adds AFA events to the
combined calendar, not to its homepage/game/team listings.

## Deployment

Build and restart both applications through the existing deployment process.
No database migration is needed for this integration. Configure and check the
feed before treating the calendar as a complete view of stadium availability.
