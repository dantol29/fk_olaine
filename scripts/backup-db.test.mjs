import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./backup-db.sh", import.meta.url));

function setup() {
  const dir = mkdtempSync(path.join(tmpdir(), "backup-db-"));
  const data = path.join(dir, "data");
  const backups = path.join(dir, "backups");
  const uploads = path.join(dir, "site", "public", "uploads");
  mkdirSync(data);
  mkdirSync(backups);
  mkdirSync(path.join(uploads, "players"), { recursive: true });
  writeFileSync(path.join(data, "app.db"), "database");
  writeFileSync(path.join(uploads, "logo.png"), "png");
  writeFileSync(path.join(uploads, "players", "a.webp"), "webp");
  return { dir, data, backups, uploads };
}

function run({ data, backups, uploads }, extraEnv = {}) {
  return spawnSync("bash", [script], {
    encoding: "utf8",
    env: { ...process.env, DATA_DIR: data, BACKUP_DIR: backups, UPLOADS_SRC: uploads, ...extraEnv },
  });
}

const names = (dir, pattern) => readdirSync(dir).filter((name) => pattern.test(name)).sort();

test("copies the database and archives the photos, keeping only the newest copies", () => {
  const paths = setup();
  try {
    // Older copies: 101 database sets (one with a -wal file) and 11 photo archives, all from 2025.
    for (let i = 0; i < 101; i++) writeFileSync(path.join(paths.backups, `app.db.20250101-${String(i).padStart(6, "0")}`), "old");
    writeFileSync(path.join(paths.backups, "app.db-wal.20250101-000000"), "old wal");
    for (let i = 0; i < 11; i++) writeFileSync(path.join(paths.backups, `uploads.20250101-${String(i).padStart(6, "0")}.tar.gz`), "old");
    writeFileSync(path.join(paths.backups, "notes.txt"), "not a backup");

    const result = run(paths);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Uploads: 2 files in uploads\.\d{8}-\d{6}\.tar\.gz/);
    assert.match(result.stdout, /Kept: 100 database copies \(limit 100\), 10 uploads archives \(limit 10\)/);

    const db = names(paths.backups, /^app\.db\.\d{8}-\d{6}$/);
    const archives = names(paths.backups, /^uploads\.\d{8}-\d{6}\.tar\.gz$/);
    assert.equal(db.length, 100);
    assert.equal(archives.length, 10);
    // The new copies are kept, the oldest sets are gone with their -wal file, other files are untouched.
    assert.ok(!db.at(-1).startsWith("app.db.2025"));
    assert.ok(!archives.at(-1).startsWith("uploads.2025"));
    assert.ok(!db.includes("app.db.20250101-000000") && !db.includes("app.db.20250101-000001"));
    assert.equal(existsSync(path.join(paths.backups, "app.db-wal.20250101-000000")), false);
    assert.equal(existsSync(path.join(paths.backups, "notes.txt")), true);

    const listed = spawnSync("tar", ["-tzf", path.join(paths.backups, archives.at(-1))], { encoding: "utf8" }).stdout;
    assert.match(listed, /uploads\/logo\.png/);
    assert.match(listed, /uploads\/players\/a\.webp/);
  } finally { rmSync(paths.dir, { recursive: true, force: true }); }
});

test("limits can be changed, and a site without an uploads folder still gets its database copy", () => {
  const paths = setup();
  try {
    rmSync(paths.uploads, { recursive: true });
    for (let i = 0; i < 5; i++) writeFileSync(path.join(paths.backups, `app.db.20250101-00000${i}`), "old");
    const result = run(paths, { KEEP_DB_BACKUPS: "3" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /No uploads folder/);
    assert.equal(names(paths.backups, /^app\.db\./).length, 3);
    assert.equal(names(paths.backups, /^uploads\./).length, 0);
  } finally { rmSync(paths.dir, { recursive: true, force: true }); }
});

test("without a database it stops and removes nothing", () => {
  const paths = setup();
  try {
    rmSync(path.join(paths.data, "app.db"));
    for (let i = 0; i < 5; i++) writeFileSync(path.join(paths.backups, `app.db.20250101-00000${i}`), "old");
    const result = run(paths, { KEEP_DB_BACKUPS: "1" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /No database/);
    assert.equal(names(paths.backups, /^app\.db\./).length, 5);
  } finally { rmSync(paths.dir, { recursive: true, force: true }); }
});
