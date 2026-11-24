import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

// Admin links must not prefetch (see admin-link.tsx): a plain next/link there brings back the burst of requests
// after each save that gets the admin's address blocked by the host for about 30 seconds.
const ADMIN_ROOTS = ["src/app/admin", "src/components/admin"].map((root) => path.join(process.cwd(), root));
const LINK_IMPORT = /from\s+["']next\/link["']/;
const ALLOWED = path.join(process.cwd(), "src/components/admin/admin-link.tsx");

test("admin code links through AdminLink, never next/link directly", () => {
  const files = ADMIN_ROOTS.flatMap((root) => readdirSync(root, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts"))
    .map((entry) => path.join(entry.parentPath, entry.name)));

  const offenders = files.filter((file) => file !== ALLOWED && LINK_IMPORT.test(readFileSync(file, "utf8")));

  assert.deepEqual(offenders.map((file) => path.relative(process.cwd(), file)), []);
  assert.ok(files.length > 50, "the scan found the admin source files");
});
