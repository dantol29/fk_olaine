import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseEventInput } from "./event-input";
import { eventIdFromSlug, eventPath, formatEventSpan, splitIntoDays } from "./events";

function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) for (const item of [value].flat()) data.append(name, item);
  return data;
}

const VALID = { title: " Ķekavas kauss ", date: "2026-12-05", startTime: "10:00", endTime: "16:00", location: " Ķekava ", notes: "" };

describe("parseEventInput", () => {
  test("keeps ticked teams once, a cleaned description, and no end date for one day", () => {
    const parsed = parseEventInput(form({ ...VALID, teamIds: ["7", "3", "7"], description: "<p>Turnīrs</p><script>x()</script>" }));
    assert.ok(!("error" in parsed));
    assert.deepEqual(parsed.teamIds, [3, 7]);
    assert.equal(parsed.description, "<p>Turnīrs</p>");
    assert.equal(parsed.endDate, null);
    assert.equal(parsed.title, "Ķekavas kauss");
  });

  test("an empty editor and no teams are fine", () => {
    const parsed = parseEventInput(form({ ...VALID, description: "<p><br></p>" }));
    assert.ok(!("error" in parsed));
    assert.equal(parsed.description, null);
    assert.deepEqual(parsed.teamIds, []);
  });

  test("several days may end at an earlier clock time; one day may not", () => {
    const multi = parseEventInput(form({ ...VALID, endDate: "2026-12-07", startTime: "18:00", endTime: "12:00" }));
    assert.ok(!("error" in multi));
    assert.equal(multi.endDate, "2026-12-07");
    assert.match(String((parseEventInput(form({ ...VALID, startTime: "18:00", endTime: "12:00" })) as { error: string }).error), /vēlāk/);
    assert.match(String((parseEventInput(form({ ...VALID, endDate: "2026-12-01" })) as { error: string }).error), /pirms/);
  });
});

describe("event dates and addresses", () => {
  test("each end of a multi-day event keeps its own time", () => {
    assert.equal(formatEventSpan("2026-12-12", "10:00", null, "16:00"), "12.12.2026 10:00–16:00");
    assert.equal(formatEventSpan("2026-12-05", "10:00", "2026-12-07", "16:00"), "05.12. 10:00 – 07.12.2026 16:00");
    assert.equal(formatEventSpan("2026-12-30", "18:00", "2027-01-01", "02:00"), "30.12.2026 18:00 – 01.01.2027 02:00");
  });

  test("an address ends with the id", () => {
    assert.equal(eventPath(12, "Ķekavas kauss 2026"), "/notikumi/kekavas-kauss-2026-12");
    assert.equal(eventIdFromSlug("vecs-nosaukums-12"), 12);
    assert.equal(eventIdFromSlug("bez-numura"), null);
  });

  test("a three-day event becomes three day pieces", () => {
    const pieces = splitIntoDays(new Date("2026-12-05T08:00:00Z"), new Date("2026-12-07T14:00:00Z"));
    assert.deepEqual(pieces.map((piece) => [piece.dateKey, piece.part, piece.parts]), [["2026-12-05", 1, 3], ["2026-12-06", 2, 3], ["2026-12-07", 3, 3]]);
    assert.equal(splitIntoDays(new Date("2026-12-05T08:00:00Z"), new Date("2026-12-05T14:00:00Z")).length, 1);
  });
});
