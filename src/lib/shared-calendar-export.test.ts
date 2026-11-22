import assert from "node:assert/strict";
import { test } from "node:test";

import type { CalendarEvent } from "./calendar";
import { buildSharedFkFeed } from "./shared-calendar-export";

const SITE = "https://fkolaine.com";
const GENERATED = new Date("2026-11-22T10:00:00.000Z");

function booking(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    uid: "training-1", title: "U14 treniņš", location: "Olaines pilsētas stadions", allDay: false,
    start: new Date("2026-11-23T14:00:00.000Z"), end: new Date("2026-11-23T15:30:00.000Z"), dateKey: "2026-11-23",
    weekdayLabel: "Pirmdiena", dateLabel: "23.11.2026", timeLabel: "16:00", dayLabel: "23", monthLabel: "Nov",
    eventType: "training", team: "U14", ...overrides,
  };
}

test("shares only the whitelisted fields, with fk-olaine ids and absolute logos", () => {
  const game = booking({
    uid: "game-7", eventType: "game", title: "FK Olaine – Ogre", homeTeam: "FK Olaine", awayTeam: "Ogre",
    homeLogo: "/uploads/logo.png", awayLogo: "javascript:alert(1)",
    gameFixture: { id: 7 } as CalendarEvent["gameFixture"],
  });
  const training = booking({ teamNames: ["U14", "U16"], trainingFixture: { id: 1 } as CalendarEvent["trainingFixture"] });
  const feed = buildSharedFkFeed([game, training], SITE, GENERATED);

  assert.deepEqual({ ...feed, events: undefined }, {
    version: 1, club: "FK Olaine", timezone: "Europe/Riga", generatedAt: "2026-11-22T10:00:00.000Z", events: undefined,
  });
  assert.deepEqual(feed.events[0], {
    uid: "fk-olaine:game-7", club: "FK Olaine", readOnly: true, title: "FK Olaine – Ogre",
    location: "Olaines pilsētas stadions", allDay: false, start: "2026-11-23T14:00:00.000Z", end: "2026-11-23T15:30:00.000Z",
    dateKey: "2026-11-23", eventType: "game", team: "U14", homeTeam: "FK Olaine", awayTeam: "Ogre",
    homeLogo: "https://fkolaine.com/uploads/logo.png", awayLogo: null,
  });
  assert.deepEqual(feed.events[1].teamNames, ["U14", "U16"]);
  assert.ok(!("trainingFixture" in feed.events[1]) && !("weekdayLabel" in feed.events[1]) && !("homeTeam" in feed.events[1]));
});

test("leaves out a booking that ends before it starts or has an invalid time, keeping the rest", () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    const feed = buildSharedFkFeed([
      booking({ uid: "training-1" }),
      booking({ uid: "training-2", end: new Date("2026-11-23T13:00:00.000Z") }),
      booking({ uid: "event-3", start: new Date("invalid") }),
    ], SITE, GENERATED);
    assert.deepEqual(feed.events.map((event) => event.uid), ["fk-olaine:training-1"]);
  } finally {
    console.warn = warn;
  }
});
