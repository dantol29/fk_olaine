import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

try {
  const transaction = await client.transaction("write");
  try {
    const table = await transaction.execute("PRAGMA table_info(league_sources)");
    if (table.rows.length === 0) throw new Error("League sources table does not exist.");
    if (!table.rows.some((row) => row.name === "logo_url")) {
      await transaction.execute("ALTER TABLE league_sources ADD COLUMN logo_url TEXT");
    }
    await transaction.commit();
    console.log("League logo column added.");
  } finally {
    transaction.close();
  }
} finally {
  client.close();
}
