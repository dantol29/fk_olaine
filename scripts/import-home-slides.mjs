import "dotenv/config";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";

// Run once after the 0.1.3 migration, on the host that stores the uploads.
const directory = path.join(process.cwd(), process.env.UPLOADS_DIR || "uploads", "home-slides");
let files;
try {
  files = await readdir(directory, { withFileTypes: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  files = [];
}
const images = files.filter((file) => file.isFile() && /^[a-f0-9-]+\.(jpg|png|webp)$/.test(file.name))
  .map((file) => `/uploads/home-slides/${file.name}`).sort();
if (!images.length) {
  console.log("No earlier homepage images found.");
  process.exit(0);
}
if (process.env.NODE_ENV === "production" && !process.env.TURSO_DATABASE_URL) throw new Error("Set TURSO_DATABASE_URL before importing production images.");
const client = createClient({ url: process.env.TURSO_DATABASE_URL ?? "file:./local.db", authToken: process.env.TURSO_AUTH_TOKEN || undefined });
try {
  const transaction = await client.transaction("write");
  try {
    const result = await transaction.execute("SELECT sakumlapas_atteli FROM site_settings WHERE id = 1");
    if (!result.rows.length) throw new Error("Site settings row 1 is missing; open the site first to initialize it.");
    const existing = String(result.rows[0].sakumlapas_atteli ?? "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    const merged = [...new Set([...existing, ...images])];
    await transaction.execute({ sql: "UPDATE site_settings SET sakumlapas_atteli = ?, updated_at = ? WHERE id = 1", args: [merged.join("\n"), Date.now()] });
    await transaction.commit();
    console.log(`Imported ${merged.length - existing.length} homepage images.`);
  } finally {
    transaction.close();
  }
} finally {
  client.close();
}
