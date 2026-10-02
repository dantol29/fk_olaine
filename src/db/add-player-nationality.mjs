import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
try {
  const columns = await client.execute("PRAGMA table_info(players)");
  if (!columns.rows.length) throw new Error("Players table does not exist.");
  if (!columns.rows.some((row) => row.name === "nationality")) {
    await client.execute("ALTER TABLE players ADD COLUMN nationality TEXT NOT NULL DEFAULT 'LV'");
  }
  console.log("Player nationality field ready; default is LV.");
} finally {
  client.close();
}
