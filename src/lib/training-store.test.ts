import assert from "node:assert/strict";
import { test } from "node:test";
import { createDatabase } from "@olaine/database/client";
import { saveTraining } from "./training-store";

test("saves and edits one shared session atomically, retaining reusable venues", async () => {
  const db = createDatabase({ url: "file::memory:" });
  const client = db.$client;
  try {
    await client.executeMultiple(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE teams (id INTEGER PRIMARY KEY);
      CREATE TABLE coaches (id INTEGER PRIMARY KEY);
      CREATE TABLE trainings (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL,
        start_time TEXT NOT NULL, end_time TEXT NOT NULL, location TEXT NOT NULL,
        notes TEXT, created_at INTEGER NOT NULL);
      CREATE TABLE training_teams (training_id INTEGER REFERENCES trainings(id) ON DELETE CASCADE,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE, PRIMARY KEY(training_id, team_id));
      CREATE TABLE training_coaches (training_id INTEGER REFERENCES trainings(id) ON DELETE CASCADE,
        coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE, PRIMARY KEY(training_id, coach_id));
      CREATE TABLE training_locations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL);
      INSERT INTO teams VALUES (1), (2), (3);
      INSERT INTO coaches VALUES (1), (2);
    `);
    const input = { teamIds: [1, 2], coachIds: [1], date: "2026-11-10", startTime: "18:00", endTime: "19:00", location: "Skola", notes: null };
    const id = await saveTraining(db, input);
    assert.equal((await client.execute("SELECT * FROM trainings")).rows.length, 1);
    assert.deepEqual((await client.execute("SELECT team_id FROM training_teams ORDER BY team_id")).rows.map((r) => r.team_id), [1, 2]);
    await saveTraining(db, { ...input, teamIds: [2, 3], coachIds: [2] }, id);
    assert.deepEqual((await client.execute("SELECT team_id FROM training_teams ORDER BY team_id")).rows.map((r) => r.team_id), [2, 3]);
    assert.equal((await client.execute("SELECT coach_id FROM training_coaches")).rows[0].coach_id, 2);
    await assert.rejects(saveTraining(db, { ...input, teamIds: [999], location: "Invalid venue" }, id));
    assert.deepEqual((await client.execute("SELECT team_id FROM training_teams ORDER BY team_id")).rows.map((r) => r.team_id), [2, 3]);
    assert.equal((await client.execute("SELECT coach_id FROM training_coaches")).rows[0].coach_id, 2);
    await client.execute("DELETE FROM teams WHERE id = 2");
    assert.equal((await client.execute("SELECT * FROM trainings")).rows.length, 1);
    await client.execute("DELETE FROM trainings");
    assert.equal((await client.execute("SELECT * FROM training_teams")).rows.length, 0);
    assert.equal((await client.execute("SELECT * FROM training_coaches")).rows.length, 0);
    assert.deepEqual((await client.execute("SELECT name FROM training_locations")).rows.map((r) => r.name), ["Skola"]);
  } finally { client.close(); }
});
