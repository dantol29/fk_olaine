import { mkdirSync } from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:./local.db";

// A local SQLite file (as opposed to a remote Turso URL) needs its parent
// directory to exist up front — libSQL creates the file itself but not the
// directories leading up to it, which matters in production where the DB
// is deliberately kept outside the deployed app folder (see .env.example).
if (databaseUrl.startsWith("file:")) {
  mkdirSync(path.dirname(databaseUrl.slice("file:".length)), { recursive: true });
}

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });
