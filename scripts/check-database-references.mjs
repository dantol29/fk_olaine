import "dotenv/config";
import { createClient } from "@libsql/client";

if (process.env.NODE_ENV === "production" && !process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL is required in production.");
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

try {
  for (const table of ["games", "league_sources", "club_logo_names", "player_teams"]) {
    const result = await client.execute(`PRAGMA foreign_key_list(${table})`);
    console.log(`${table} foreign keys:`, JSON.stringify(result.rows));
  }
  const violations = await client.execute("PRAGMA foreign_key_check");
  console.log("Foreign key violations:", JSON.stringify(violations.rows));
  const orphanedSources = await client.execute(
    "SELECT s.id, s.team_id FROM league_sources s LEFT JOIN teams t ON t.id = s.team_id WHERE t.id IS NULL",
  );
  console.log("League sources with missing teams:", JSON.stringify(orphanedSources.rows));
  process.exitCode = violations.rows.length || orphanedSources.rows.length ? 1 : 0;
} finally {
  client.close();
}
