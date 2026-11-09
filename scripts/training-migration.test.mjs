import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { createClient } from "@libsql/client";

const migration = fileURLToPath(import.meta.resolve("@olaine/database/migrations/add-training-teams.mjs"));

for (const invalidReference of [false, true]) {
  test(invalidReference ? "invalid legacy references roll back the migration" : "0.1.2 migrates table-level foreign keys without losing coach links or training IDs", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "olaine-db-0.1.2-"));
    const url = `file:${path.join(directory, "legacy.db")}`;
    const client = createClient({ url });
    const migrate = () => spawnSync(process.execPath, [migration], {
      env: { ...process.env, TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "" }, encoding: "utf8",
    });
    try {
      await client.execute("PRAGMA foreign_keys = OFF");
      await client.executeMultiple(`
        CREATE TABLE teams (id INTEGER PRIMARY KEY);
        CREATE TABLE coaches (id INTEGER PRIMARY KEY);
        CREATE TABLE trainings (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          team_id INTEGER NOT NULL,
          date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,
          location TEXT NOT NULL, notes TEXT, created_at INTEGER NOT NULL,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE no action ON DELETE cascade
        );
        CREATE TABLE training_coaches (
          training_id INTEGER NOT NULL, coach_id INTEGER NOT NULL,
          PRIMARY KEY(training_id, coach_id),
          FOREIGN KEY(training_id) REFERENCES trainings(id) ON DELETE CASCADE,
          FOREIGN KEY(coach_id) REFERENCES coaches(id) ON DELETE CASCADE
        );
        CREATE INDEX trainings_date ON trainings(date);
        INSERT INTO teams VALUES (1), (2);
        INSERT INTO coaches VALUES (1);
        INSERT INTO trainings VALUES (7, ${invalidReference ? 99 : 1}, '2026-11-10', '18:00', '19:00', 'Skola', 'Keep me', 123);
        INSERT INTO trainings VALUES (100, 2, '2026-11-11', '18:00', '19:00', 'Stadions', NULL, 123);
        DELETE FROM trainings WHERE id = 100;
        INSERT INTO training_coaches VALUES (7, 1);
      `);
      const result = migrate();
      if (invalidReference) {
        assert.notEqual(result.status, 0);
        assert.ok((await client.execute("PRAGMA table_info(trainings)")).rows.some((r) => r.name === "team_id"));
        assert.equal((await client.execute("SELECT team_id FROM trainings")).rows[0].team_id, 99);
        assert.equal((await client.execute("SELECT * FROM training_coaches")).rows.length, 1);
        return;
      }
      assert.equal(result.status, 0, result.stderr);
      assert.equal(migrate().status, 0, "migration can be rerun");
      assert.deepEqual((await client.execute("SELECT training_id, team_id FROM training_teams")).rows.map((r) => [r.training_id, r.team_id]), [[7, 1]]);
      assert.equal((await client.execute("SELECT notes FROM trainings")).rows[0].notes, "Keep me");
      assert.equal((await client.execute("SELECT * FROM training_coaches")).rows.length, 1);
      assert.ok((await client.execute("PRAGMA index_list(trainings)")).rows.some((r) => r.name === "trainings_date"));
      const inserted = await client.execute("INSERT INTO trainings (date, start_time, end_time, location, created_at) VALUES ('2026-11-12', '18:00', '19:00', 'Skola', 123) RETURNING id");
      assert.equal(inserted.rows[0].id, 101);
      assert.equal((await client.execute("PRAGMA foreign_key_check")).rows.length, 0);
    } finally {
      client.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
