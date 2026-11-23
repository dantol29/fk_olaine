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
