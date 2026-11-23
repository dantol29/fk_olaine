import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildForHosting, findLogErrors, rollbackBuild } from "./build-hosting.mjs";

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "hosting-build-"));
  mkdirSync(path.join(root, ".next"));
  writeFileSync(path.join(root, ".next", "BUILD_ID"), "working-build");
  writeFileSync(path.join(root, "package.json"), "{}");
  writeFileSync(path.join(root, "local.db"), "database");
  mkdirSync(path.join(root, "virtualenv"));
  symlinkSync(path.join(root, "virtualenv"), path.join(root, "node_modules"), "dir");
  return root;
}

test("a killed build leaves the live build, previous backup, and dependency link unchanged", async () => {
  const root = fixture();
  try {
    mkdirSync(path.join(root, ".next.previous"));
    writeFileSync(path.join(root, ".next.previous", "BUILD_ID"), "older-build");
    await assert.rejects(buildForHosting({ root, logDir: path.join(root, "logs"), runBuild: async ({ cwd, env }) => {
      assert.notEqual(cwd, root);
      assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
      assert.equal(realpathSync(path.join(cwd, "node_modules")), realpathSync(path.join(root, "virtualenv")));
      assert.equal(realpathSync(path.join(cwd, "local.db")), realpathSync(path.join(root, "local.db")));
      assert.equal(env.NEXT_LOW_MEMORY_BUILD, "1");
      assert.match(env.NODE_OPTIONS, /--max-old-space-size=512/);
      mkdirSync(path.join(cwd, ".next"));
      writeFileSync(path.join(cwd, ".next/partial"), "incomplete");
      return { code: null, signal: "SIGKILL" };
    } }), /SIGKILL/);
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
    assert.equal(readFileSync(path.join(root, ".next.previous/BUILD_ID"), "utf8"), "older-build");
    assert.equal(existsSync(path.join(root, "tmp/restart.txt")), false);
    assert.equal(existsSync(path.join(root, ".build-work/lock")), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("successful builds retain a rollback and restart only after promotion", async () => {
  const root = fixture();
  try {
    await buildForHosting({ root, logDir: path.join(root, "logs"), runBuild: async ({ cwd }) => {
      mkdirSync(path.join(cwd, ".next"));
      writeFileSync(path.join(cwd, ".next/BUILD_ID"), "new-build");
      return { code: 0, signal: null };
    } });
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "new-build");
    assert.equal(readFileSync(path.join(root, ".next.previous/BUILD_ID"), "utf8"), "working-build");
    assert.equal(existsSync(path.join(root, "tmp/restart.txt")), true);
    rollbackBuild(root);
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
    assert.equal(readFileSync(path.join(root, ".next.previous/BUILD_ID"), "utf8"), "new-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a successful exit without a complete build cannot replace the live build", async () => {
  const root = fixture();
  try {
    await assert.rejects(buildForHosting({ root, logDir: path.join(root, "logs"), runBuild: async () => ({ code: 0, signal: null }) }), /BUILD_ID/);
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("replacing an incomplete live build preserves the last complete rollback", async () => {
  const root = fixture();
  try {
    rmSync(path.join(root, ".next/BUILD_ID"));
    mkdirSync(path.join(root, ".next.previous"));
    writeFileSync(path.join(root, ".next.previous/BUILD_ID"), "last-working-build");
    await buildForHosting({ root, logDir: path.join(root, "logs"), runBuild: async ({ cwd }) => {
      mkdirSync(path.join(cwd, ".next"));
      writeFileSync(path.join(cwd, ".next/BUILD_ID"), "recovered-build");
      return { code: 0, signal: null };
    } });
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "recovered-build");
    assert.equal(readFileSync(path.join(root, ".next.previous/BUILD_ID"), "utf8"), "last-working-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("an error in the build log keeps the live build, unless explicitly allowed", async () => {
  const root = fixture();
  const brokenPageBuild = async ({ cwd, logFile }) => {
    mkdirSync(path.join(cwd, ".next"));
    writeFileSync(path.join(cwd, ".next/BUILD_ID"), "new-build");
    writeFileSync(logFile, "Generating static pages\nError: no such column: events.end_date\n✓ Generating static pages\n");
    return { code: 0, signal: null };
  };
  try {
    await assert.rejects(buildForHosting({ root, logDir: path.join(root, "logs"), runBuild: brokenPageBuild }), /1 error line[\s\S]*no such column/);
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
    assert.equal(existsSync(path.join(root, "tmp/restart.txt")), false);
    assert.equal(existsSync(path.join(root, ".build-work/lock")), false);

    await buildForHosting({ root, logDir: path.join(root, "logs"), allowLogErrors: true, runBuild: brokenPageBuild });
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "new-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("the build log is kept in the log folder with the date and time in its name", async () => {
  const root = fixture();
  try {
    let usedLog;
    await buildForHosting({ root, logDir: path.join(root, "logs"), now: new Date(2026, 10, 23, 11, 5, 9), runBuild: async ({ cwd, logFile }) => {
      usedLog = logFile;
      writeFileSync(logFile, "✓ Compiled successfully\n");
      mkdirSync(path.join(cwd, ".next"));
      writeFileSync(path.join(cwd, ".next/BUILD_ID"), "new-build");
      return { code: 0, signal: null };
    } });
    assert.equal(usedLog, path.join(root, "logs", "build-20261123-110509.log"));
    assert.equal(readFileSync(usedLog, "utf8"), "✓ Compiled successfully\n");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("only error lines count; the usual hosting warnings do not", () => {
  assert.deepEqual(findLogErrors([
    "⚠ Attempted to load @next/swc-linux-x64-gnu, but an error occurred: /lib64/libm.so.6: version `GLIBC_2.29' not found",
    "Retrying 1/3...",
    "write EPIPE",
    "✓ Compiled successfully in 3.5min",
    "SqliteError: SQLITE_ERROR: no such table: event_teams",
  ].join("\n")), ["SqliteError: SQLITE_ERROR: no such table: event_teams"]);
});

test("a wrong hosting environment stops the build before anything is copied or built", async () => {
  const root = fixture();
  try {
    let built = false;
    await assert.rejects(buildForHosting({
      root,
      logDir: path.join(root, "logs"),
      checkEnv: () => { throw new Error("The active environment belongs to fk_olaine_code, but this is afa_olaine."); },
      runBuild: async () => { built = true; return { code: 0, signal: null }; },
    }), /belongs to fk_olaine_code/);
    assert.equal(built, false);
    assert.equal(existsSync(path.join(root, ".build-work")), false);
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("packages that differ from package-lock.json stop the build before anything is built", async () => {
  const root = fixture();
  try {
    let built = false;
    await assert.rejects(buildForHosting({
      root,
      logDir: path.join(root, "logs"),
      checkPackages: () => ["@olaine/database: installed 0.1.3, package-lock.json has 0.1.4"],
      runBuild: async () => { built = true; return { code: 0, signal: null }; },
    }), /installed 0\.1\.3[\s\S]*Run npm install/);
    assert.equal(built, false);
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("on the host a build needs a fresh backup, unless BUILD_WITHOUT_BACKUP is set", async () => {
  const root = fixture();
  const onHost = () => ({ onHost: true, database: "file:/home/site-data/app.db" });
  const build = async ({ cwd }) => {
    mkdirSync(path.join(cwd, ".next"));
    writeFileSync(path.join(cwd, ".next/BUILD_ID"), "new-build");
    return { code: 0, signal: null };
  };
  try {
    await assert.rejects(buildForHosting({ root, logDir: path.join(root, "logs"), checkEnv: onHost, readBackup: () => null, allowNoBackup: false, runBuild: build }),
      /No database backup[\s\S]*bash scripts\/backup-db\.sh/);
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
    const old = { ts: "20261124-070000", ageMinutes: 300, restoreDatabase: "cp -p b a", restorePhotos: null };
    await assert.rejects(buildForHosting({ root, logDir: path.join(root, "logs"), checkEnv: onHost, readBackup: () => old, allowNoBackup: false, runBuild: build }),
      /300 minutes old/);
    await buildForHosting({ root, logDir: path.join(root, "logs"), checkEnv: onHost, readBackup: () => null, allowNoBackup: true, runBuild: build });
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "new-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
