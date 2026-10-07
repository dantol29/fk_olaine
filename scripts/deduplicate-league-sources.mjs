import "dotenv/config";
import { createClient } from "@libsql/client";

const mappings = [[1, 5], [2, 6], [3, 7]];
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
  const sources = await transaction.execute("SELECT id, team_id, label FROM league_sources");
  const tables = await transaction.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
  const references = [];
  for (const { name } of tables.rows) {
    const keys = await transaction.execute(`PRAGMA foreign_key_list(${quote(name)})`);
    for (const key of keys.rows) {
      if (key.table === "league_sources" && key.to === "id") {
        references.push({ table: name, column: key.from });
      }
    }
  }
  const gameColumns = await transaction.execute("PRAGMA table_info(games)");
  const hasSourceId = gameColumns.rows.some((column) => column.name === "league_source_id");
  // Also handle installations where the column exists without its constraint.
  if (hasSourceId && !references.some((ref) => ref.table === "games" && ref.column === "league_source_id")) {
    references.push({ table: "games", column: "league_source_id" });
  }
  for (const [oldId, keepId] of mappings) {
    const old = sources.rows.find((source) => Number(source.id) === oldId);
    if (!old) continue;
    const keep = sources.rows.find((source) => Number(source.id) === keepId);
    if (!keep || Number(old.team_id) !== Number(keep.team_id) || Number(keep.team_id) !== keepId) {
      throw new Error(`Sources #${oldId} and #${keepId} must belong to the repaired team #${keepId}. Cleanup cancelled.`);
    }
    console.log(`Remove source #${oldId} (${old.label}); keep #${keepId} (${keep.label}), team #${keep.team_id}`);
    if (!apply) continue;
    if (hasSourceId) {
      await transaction.execute({
        sql: "UPDATE games SET league_source_id = ?, league = ? WHERE league_source_id = ? OR (league_source_id IS NULL AND team_id = ? AND league = ?)",
        args: [keepId, keep.label, oldId, old.team_id, old.label],
      });
    } else {
      await transaction.execute({
        sql: "UPDATE games SET league = ? WHERE team_id = ? AND league = ?",
        args: [keep.label, old.team_id, old.label],
      });
    }
    for (const ref of references) {
      await transaction.execute({
        sql: `UPDATE ${quote(ref.table)} SET ${quote(ref.column)} = ? WHERE ${quote(ref.column)} = ?`,
        args: [keepId, oldId],
      });
    }
    await transaction.execute({ sql: "DELETE FROM league_sources WHERE id = ?", args: [oldId] });
  }
  if (apply) {
    const violations = await transaction.execute("PRAGMA foreign_key_check");
    if (violations.rows.length) {
      throw new Error(`Cleanup rolled back due to invalid references: ${JSON.stringify(violations.rows)}`);
    }
    await transaction.commit();
    console.log("Duplicate sources removed. Existing games preserved.");
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
