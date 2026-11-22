import assert from "node:assert/strict";
import { test } from "node:test";

import { rigaMidnight, splitIntoDays } from "./shared-calendar-days";

const iso = (date: Date) => date.toISOString();

test("rigaMidnight follows daylight saving", () => {
  assert.equal(iso(rigaMidnight("2026-12-13")), "2026-12-12T22:00:00.000Z");
  assert.equal(iso(rigaMidnight("2026-07-01")), "2026-06-30T21:00:00.000Z");
  assert.equal(iso(rigaMidnight("2027-03-28")), "2027-03-27T22:00:00.000Z");
});

test("an entry within one day stays one piece", () => {
  const start = new Date("2026-12-12T08:00:00.000Z");
  const end = new Date("2026-12-12T21:59:00.000Z");
  assert.deepEqual(splitIntoDays(start, end), [{ dateKey: "2026-12-12", start, end, part: 1, parts: 1 }]);
});

test("an entry ending exactly at midnight stays on its day", () => {
  const pieces = splitIntoDays(new Date("2026-12-12T18:00:00.000Z"), new Date("2026-12-12T22:00:00.000Z"));
  assert.deepEqual(pieces.map((piece) => piece.dateKey), ["2026-12-12"]);
});

test("a three-day event becomes first, whole and last day pieces", () => {
  // Riga: Sat 12 Dec 10:00 to Mon 14 Dec 16:00 (UTC+2).
  const pieces = splitIntoDays(new Date("2026-12-12T08:00:00.000Z"), new Date("2026-12-14T14:00:00.000Z"));
  assert.deepEqual(
    pieces.map((piece) => [piece.dateKey, iso(piece.start), iso(piece.end), `${piece.part}/${piece.parts}`]),
    [
      ["2026-12-12", "2026-12-12T08:00:00.000Z", "2026-12-12T21:59:00.000Z", "1/3"],
      ["2026-12-13", "2026-12-12T22:00:00.000Z", "2026-12-13T21:59:00.000Z", "2/3"],
      ["2026-12-14", "2026-12-13T22:00:00.000Z", "2026-12-14T14:00:00.000Z", "3/3"],
    ],
  );
});
