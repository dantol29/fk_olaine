import "dotenv/config";
import { createClient } from "@libsql/client";

const mappings = [[1, 5, "Virsliga"], [2, 6, "1. liga"], [3, 7, "U16"]];
const apply = process.argv.includes("--apply");
if (process.env.NODE_ENV === "production" && !process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL is required in production.");
}
const quote = (name) => `"${String(name).replaceAll('"', '""')}"`;
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
let transaction;
try {
  await client.execute("PRAGMA foreign_keys = ON");
  transaction = await client.transaction("write");
  const teams = await transaction.execute("SELECT id, name FROM teams");
  for (const [oldId, newId, expectedName] of mappings) {
    if (teams.rows.some((team) => Number(team.id) === oldId)) {
      throw new Error(`Team #${oldId} exists. Refusing to remap an existing team.`);
    }
    const target = teams.rows.find((team) => Number(team.id) === newId);
    if (!target || target.name !== expectedName) {
      throw new Error(`Expected team #${newId} to be ${expectedName}. Repair cancelled.`);
    }
  }
  const u14 = teams.rows.find((team) => Number(team.id) === 4);
  if (u14 && u14.name !== "U14") {
    throw new Error("Team #4 exists with a different name. Repair cancelled.");
  }
  if (!u14) {
    if (teams.rows.some((team) => team.name === "U14")) {
      throw new Error("U14 already exists with a different ID. Repair cancelled.");
    }
    console.log("Restore team #4: U14 (preserves its existing games)");
    if (apply) {
      await transaction.execute({
        sql: "INSERT INTO teams (id, name, created_at) VALUES (?, ?, ?)",
        args: [4, "U14", Date.now()],
      });
    }
  }
  const tables = await transaction.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
  for (const { name } of tables.rows) {
    const foreignKeys = await transaction.execute(`PRAGMA foreign_key_list(${quote(name)})`);
    for (const key of foreignKeys.rows.filter((key) => key.table === "teams" && key.to === "id")) {
      for (const [oldId, newId] of mappings) {
        const count = await transaction.execute({
          sql: `SELECT COUNT(*) AS total FROM ${quote(name)} WHERE ${quote(key.from)} = ?`,
          args: [oldId],
        });
        const total = Number(count.rows[0].total);
        if (!total) continue;
        console.log(`${name}.${key.from}: ${oldId} → ${newId} (${total} rows)`);
        if (apply) {
          await transaction.execute({
            sql: `UPDATE ${quote(name)} SET ${quote(key.from)} = ? WHERE ${quote(key.from)} = ?`,
            args: [newId, oldId],
          });
        }
      }
    }
  }
  if (apply) {
    const violations = await transaction.execute("PRAGMA foreign_key_check");
    if (violations.rows.length) {
      const orphanedGames = await transaction.execute(
        "SELECT g.id, g.team_id, g.home_team, g.away_team, g.league FROM games g LEFT JOIN teams t ON t.id = g.team_id WHERE t.id IS NULL ORDER BY g.team_id, g.id",
      );
      throw new Error(`Unresolved foreign keys; repair rolled back: ${JSON.stringify(violations.rows)}\nGames with missing teams: ${JSON.stringify(orphanedGames.rows)}`);
    }
    await transaction.commit();
    console.log("Repair committed. All foreign key references are valid.");
  } else {
    await transaction.rollback();
    console.log("Preview only. Run with --apply to save these changes.");
  }
} catch (error) {
  if (transaction && !transaction.closed) await transaction.rollback();
  throw error;
} finally {
  transaction?.close();
  client.close();
}
