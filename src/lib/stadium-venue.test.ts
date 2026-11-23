import assert from "node:assert/strict";
import test from "node:test";
import { bookingsForVenueOnDay } from "./stadium-venue";

const start = new Date("2026-11-22T22:00:00Z");
const end = new Date("2026-11-23T22:00:00Z");
const booking = (uid: string, from: string, to: string, location = "Olaines pilsētas stadions") => ({ uid, location, start: new Date(from), end: new Date(to) });

test("venue availability includes overnight FK bookings, respects aliases and excludes the edited event", () => {
  const events = [
    booking("overnight", "2026-11-22T21:30:00Z", "2026-11-22T22:30:00Z"),
    booking("edited", "2026-11-23T10:00:00Z", "2026-11-23T11:00:00Z"),
    booking("other-venue", "2026-11-23T10:00:00Z", "2026-11-23T11:00:00Z", "Skola"),
    booking("ended-at-midnight", "2026-11-22T21:00:00Z", "2026-11-22T22:00:00Z"),
    booking("next-day", "2026-11-23T22:00:00Z", "2026-11-23T23:00:00Z"),
  ];
  assert.deepEqual(bookingsForVenueOnDay(events, "Olaines stadions", start, end, "edited").map((event) => event.uid), ["overnight"]);
});

test("venue availability over several days covers every day of the range, not only the first", () => {
  // 12.–14.12.2026 in Riga (UTC+2): from 11.12. 22:00 UTC to 14.12. 22:00 UTC.
  const from = new Date("2026-12-11T22:00:00Z");
  const to = new Date("2026-12-14T22:00:00Z");
  const events = [
    booking("game-on-day-two", "2026-12-13T12:00:00Z", "2026-12-13T14:00:00Z"),
    booking("training-on-last-day", "2026-12-14T16:00:00Z", "2026-12-14T17:30:00Z"),
    booking("day-after", "2026-12-15T10:00:00Z", "2026-12-15T11:00:00Z"),
    booking("event-7@2026-12-13", "2026-12-12T22:00:00Z", "2026-12-13T22:00:00Z"),
  ];
  assert.deepEqual(bookingsForVenueOnDay(events, "Olaines stadions", from, to, "event-7").map((event) => event.uid), ["game-on-day-two", "training-on-last-day"]);
});
