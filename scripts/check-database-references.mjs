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
  const teams = await client.execute("SELECT id, name FROM teams ORDER BY id");
  console.log("Current teams:", JSON.stringify(teams.rows));
  const sources = await client.execute("SELECT id, team_id, label FROM league_sources ORDER BY id");
  console.log("League sources:", JSON.stringify(sources.rows));
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
  const orphanedGameTeams = await client.execute(
    "SELECT id, team_id, home_team, away_team, league FROM (SELECT g.id, g.team_id, g.home_team, g.away_team, g.league, ROW_NUMBER() OVER (PARTITION BY g.team_id ORDER BY g.id) AS sample_number FROM games g LEFT JOIN teams t ON t.id = g.team_id WHERE t.id IS NULL) WHERE sample_number <= 3 ORDER BY team_id, id",
  );
  console.log("Sample games with missing teams:", JSON.stringify(orphanedGameTeams.rows));
  process.exitCode = violations.rows.length || orphanedSources.rows.length ? 1 : 0;
} finally {
  client.close();
}
