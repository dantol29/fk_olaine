import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({ url: process.env.TURSO_DATABASE_URL ?? "file:./local.db", authToken: process.env.TURSO_AUTH_TOKEN || undefined });
try {
  const columns = await client.execute("PRAGMA table_info(teams)");
  if (!columns.rows.length) throw new Error("Teams table does not exist.");
  if (!columns.rows.some((column) => column.name === "is_main")) {
    await client.execute("ALTER TABLE teams ADD COLUMN is_main INTEGER NOT NULL DEFAULT 0");
  }
  const transaction = await client.transaction("write");
  try {
    const rows = (await transaction.execute("SELECT id, name, is_main FROM teams ORDER BY id")).rows;
    if (!rows.some((team) => team.is_main === 1)) {
      const selected = rows.find((team) => /^1\.?\s*l[iī]ga$/i.test(String(team.name).trim())) ?? rows[0];
      if (selected) await transaction.execute({ sql: "UPDATE teams SET is_main = 1 WHERE id = ?", args: [selected.id] });
    }
    await transaction.execute("CREATE UNIQUE INDEX IF NOT EXISTS teams_one_main ON teams(is_main) WHERE is_main = 1");
    await transaction.commit();
  } finally { transaction.close(); }
  console.log("Main team setting added; the current homepage team is selected.");
} finally { client.close(); }
