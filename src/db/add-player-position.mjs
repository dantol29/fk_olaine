import "dotenv/config";
import { createClient } from "@libsql/client";
const client = createClient({ url: process.env.TURSO_DATABASE_URL ?? "file:./local.db", authToken: process.env.TURSO_AUTH_TOKEN || undefined });
try {
  const columns = await client.execute("PRAGMA table_info(players)");
  if (!columns.rows.length) throw new Error("Players table does not exist.");
  if (!columns.rows.some((row) => row.name === "position")) await client.execute("ALTER TABLE players ADD COLUMN position TEXT");
  console.log("Player position field ready.");
} finally { client.close(); }
