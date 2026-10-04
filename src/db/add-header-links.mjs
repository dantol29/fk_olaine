import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const columns = [
  ["header_tv_name", "FKOLAINE TV"],
  ["header_tv_url", "https://www.youtube.com/c/avanakeks/videos"],
  ["header_join_name", "Pievienojies"],
  ["header_join_url", "#pievienojies"],
  ["header_federation_name", "Federācija"],
  ["header_federation_url", "https://lff.lv/"],
];

try {
  const transaction = await client.transaction("write");
  try {
    const table = await transaction.execute("PRAGMA table_info(site_settings)");
    if (table.rows.length === 0) throw new Error("Site settings table does not exist.");
    for (const [name, defaultValue] of columns) {
      if (!table.rows.some((row) => row.name === name)) {
        await transaction.execute(`ALTER TABLE site_settings ADD COLUMN ${name} TEXT NOT NULL DEFAULT '${defaultValue.replaceAll("'", "''")}'`);
      }
    }
    await transaction.commit();
    console.log("Header button settings added.");
  } finally {
    transaction.close();
  }
} finally {
  client.close();
}
