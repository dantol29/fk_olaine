import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
try {
  const transaction = await client.transaction("write");
  try {
    const table = await transaction.execute("PRAGMA table_info(games)");
    if (!table.rows.length) throw new Error("Games table does not exist.");
    for (const column of ["home_score", "away_score"]) {
      if (!table.rows.some((row) => row.name === column)) {
        await transaction.execute(`ALTER TABLE games ADD COLUMN ${column} INTEGER`);
      }
    }
    await transaction.commit();
    console.log("Game score columns added.");
  } finally {
    transaction.close();
  }
} finally {
  client.close();
}
