import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { backupProblem, packageMismatches, readLastBackup, recoveryLines } from "./deploy-status.mjs";

function site() {
  const root = mkdtempSync(path.join(tmpdir(), "deploy-status-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({
    dependencies: { "@olaine/database": "npm:@dantol29/database@0.1.4", next: "16.0.0" },
    devDependencies: { typescript: "5.0.0" },
  }));
  writeFileSync(path.join(root, "package-lock.json"), JSON.stringify({ packages: {
    "node_modules/@olaine/database": { version: "0.1.4" },
    "node_modules/next": { version: "16.0.0" },
    "node_modules/typescript": { version: "5.0.0" },
  } }));
  const install = (name, version) => {
    mkdirSync(path.join(root, "node_modules", name), { recursive: true });
    writeFileSync(path.join(root, "node_modules", name, "package.json"), JSON.stringify({ version }));
  };
  return { root, install };
}

test("packages that differ from package-lock.json, or are missing, are named", () => {
  const { root, install } = site();
  try {
    install("@olaine/database", "0.1.3");
    install("next", "16.0.0");
    assert.deepEqual(packageMismatches(root), [
      "@olaine/database: installed 0.1.3, package-lock.json has 0.1.4",
      "typescript: installed nothing, package-lock.json has 5.0.0",
    ]);
    install("@olaine/database", "0.1.4");
    install("typescript", "5.0.0");
    assert.deepEqual(packageMismatches(root), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("the last backup is read with its age, and a missing or old one is a problem", () => {
  const { root } = site();
  try {
    const file = path.join(root, ".last-backup");
    assert.equal(readLastBackup(root, { file }), null);
    assert.match(backupProblem(null), /No database backup/);
    writeFileSync(file, "TS=20261124-101500\nDB_RESTORE=rm -f a && cp -p b a\nPHOTOS_RESTORE=\n");
    const fresh = readLastBackup(root, { file });
    assert.equal(fresh.ts, "20261124-101500");
    assert.equal(fresh.restoreDatabase, "rm -f a && cp -p b a");
    assert.equal(backupProblem(fresh), null);
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    utimesSync(file, threeHoursAgo, threeHoursAgo);
    assert.match(backupProblem(readLastBackup(root, { file })), /20261124-101500\) is 18\d minutes old/);
    const lines = recoveryLines(root, fresh).join("\n");
    assert.match(lines, /npm run build:rollback/);
    assert.match(lines, /run: rm -f a && cp -p b a — then start the app \(copy 20261124-101500\)/);
    assert.match(lines, /npm install && npm run build:hosting/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
