import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase("lv");
try {
  await client.execute("PRAGMA foreign_keys = ON");
  const transaction = await client.transaction("write");
  try {
    const columns = await transaction.execute("PRAGMA table_info(games)");
    if (!columns.rows.length) throw new Error("Games table does not exist.");
    if (!columns.rows.some((column) => column.name === "league_source_id")) {
      await transaction.execute("ALTER TABLE games ADD COLUMN league_source_id INTEGER REFERENCES league_sources(id) ON DELETE SET NULL");
    }
    await transaction.execute("CREATE INDEX IF NOT EXISTS games_league_source_id ON games(league_source_id)");
    const sources = await transaction.execute("SELECT id, team_id, label FROM league_sources");
    const games = await transaction.execute("SELECT id, team_id, league FROM games WHERE league_source_id IS NULL");
    let linked = 0;
    for (const game of games.rows) {
      const matches = sources.rows.filter((source) => source.team_id === game.team_id && normalize(source.label) === normalize(game.league));
      if (matches.length !== 1) continue;
      await transaction.execute({ sql: "UPDATE games SET league_source_id = ? WHERE id = ?", args: [matches[0].id, game.id] });
      linked++;
    }
    await transaction.commit();
    console.log(`League-source relationship ready. Linked ${linked} games; ${games.rows.length - linked} remain unassigned.`);
  } finally {
    transaction.close();
  }
} finally {
  client.close();
}
