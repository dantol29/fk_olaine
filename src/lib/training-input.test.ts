import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTrainingInput } from "./training-input";

test("validates multiple teams, deduplicates selections, and accepts a new venue", () => {
  const data = new FormData();
  data.append("teamIds", "1");
  data.append("teamIds", "2");
  data.append("teamIds", "1");
  data.append("coachIds", "3");
  data.append("coachIds", "3");
  data.set("date", "2026-11-10");
  data.set("startTime", "18:00");
  data.set("endTime", "19:00");
  data.set("location", "");
  data.set("customLocation", "  Skolas sporta zāle  ");
  const parsed = parseTrainingInput(data);
  assert.ok(!("error" in parsed));
  assert.deepEqual(parsed.teamIds, [1, 2]);
  assert.deepEqual(parsed.coachIds, [3]);
  assert.equal(parsed.location, "Skolas sporta zāle");
  data.delete("teamIds");
  assert.ok("error" in parseTrainingInput(data));
  data.append("teamIds", "-1");
  assert.ok("error" in parseTrainingInput(data));
  data.set("teamIds", "1");
  data.set("endTime", "17:00");
  assert.ok("error" in parseTrainingInput(data));
});
