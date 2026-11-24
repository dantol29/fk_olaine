// What a deploy on the cPanel host needs to know before and after it changes anything: whether the shared database
// package is installed in the version package.json pins, the last backup made by scripts/backup-db.sh (with the commands that restore it), and the
// commit to go back to. Shared by AFA Olaine and FK Olaine (same file in both repositories); see docs/hosting.md.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** A backup older than this does not count as "made before this deploy". */
export const BACKUP_MAX_AGE_MINUTES = 120;
/** Written by scripts/backup-db.sh into the application folder; LAST_BACKUP_FILE moves it (tests). */
export const LAST_BACKUP_FILE = ".last-backup";

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** The packages whose installed version must be the one package.json pins. Only the shared database package: it is
 *  built into the site, its schema must match the migrated database, and its releases are ours. The host's npm
 *  (CloudLinux) resolves everything else on its own (newer versions in range, package-lock.json ignored, some dev
 *  tools left out), and the sites have always run like that, so other packages are not checked. */
export const CHECKED_PACKAGES = ["@olaine/database"];
/** "0.1.4" from "0.1.4" or "npm:@dantol29/database@0.1.4". */
const EXACT_VERSION = /^(?:npm:(?:@[^/@]+\/)?[^@]+@)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

/** "name: installed 0.1.3, package.json pins 0.1.4" for a checked package (CHECKED_PACKAGES) that is installed in
 *  another version or not at all. A build with it would compile against the wrong database schema. */
export function packageMismatches(root) {
  const manifest = readJson(path.join(root, "package.json"));
  const specs = { ...manifest.dependencies, ...manifest.devDependencies };
  const problems = [];
  for (const name of CHECKED_PACKAGES) {
    const pinned = EXACT_VERSION.exec(String(specs[name] ?? ""))?.[1];
    if (!pinned) continue;
    const installedFile = path.join(root, "node_modules", name, "package.json");
    const installed = existsSync(installedFile) ? readJson(installedFile).version : null;
    if (installed !== pinned) problems.push(`${name}: installed ${installed ?? "nothing"}, package.json pins ${pinned}`);
  }
  return problems;
}

/** The last backup recorded by scripts/backup-db.sh, or null: its time stamp, age and restore commands. */
export function readLastBackup(root, { file = process.env.LAST_BACKUP_FILE ?? path.join(root, LAST_BACKUP_FILE), now = Date.now() } = {}) {
  if (!existsSync(file)) return null;
  const fields = Object.fromEntries(readFileSync(file, "utf8").split(/\r?\n/).filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
  return {
    ts: fields.TS ?? "?",
    ageMinutes: Math.floor((now - statSync(file).mtimeMs) / 60_000),
    restoreDatabase: fields.DB_RESTORE ?? null,
    restorePhotos: fields.PHOTOS_RESTORE ?? null,
  };
}

/** Why a step that changes the live site must not start without a fresh backup, or null when there is one. */
export function backupProblem(backup, maxAgeMinutes = BACKUP_MAX_AGE_MINUTES) {
  if (!backup) return "No database backup has been recorded for this site.";
  if (backup.ageMinutes > maxAgeMinutes) return `The last database backup (${backup.ts}) is ${backup.ageMinutes} minutes old.`;
  return null;
}

function git(root, args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

/** "abc1234 fix: …" for the code being built. */
export function currentCommit(root) {
  return git(root, ["log", "-1", "--format=%h %s"]) ?? "unknown (not a git checkout)";
}

/** The commit HEAD pointed to before the last pull or checkout, to go back to the whole previous version. */
export function previousCommit(root) {
  return git(root, ["rev-parse", "--short", "HEAD@{1}"]);
}

/** The lines that tell how to undo a deploy: the build, the database and the packages. */
export function recoveryLines(root, backup = readLastBackup(root)) {
  const previous = previousCommit(root);
  const database = backup?.restoreDatabase
    ? `stop the app in Setup Node.js App, run: ${backup.restoreDatabase} — then start the app (copy ${backup.ts}).`
    : "no backup recorded; run bash scripts/backup-db.sh before the next deploy.";
  return [
    "If the new version misbehaves:",
    "  - Build (seconds): npm run build:rollback",
    `  - Database (only if this deploy ran db:migrate; a build rollback does not touch it): ${database}`,
    `  - Code and packages together: git checkout ${previous ?? "<commit before the deploy, see git reflog>"} && npm install && npm run build:hosting`
      + " (go back with git checkout main).",
  ];
}
