import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const quoteColumns = ["quote_text", "quote_author", "quote_role"];

try {
  const transaction = await client.transaction("write");
  try {
    const table = await transaction.execute("PRAGMA table_info(articles)");
    if (table.rows.length === 0) throw new Error("Articles table does not exist.");
    const existingColumns = new Set(table.rows.map((row) => row.name));
    for (const column of quoteColumns) {
      if (existingColumns.has(column)) {
        await transaction.execute(`ALTER TABLE articles DROP COLUMN ${column}`);
      }
    }
    await transaction.commit();
    console.log("Article quote columns removed.");
  } finally {
    transaction.close();
  }
} finally {
  client.close();
}
