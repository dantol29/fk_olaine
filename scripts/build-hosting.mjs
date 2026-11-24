// Production build for the cPanel host, shared with FK Olaine (same file in both repositories).
//
// The site keeps running from `.next` while a new version is built in a separate copy of the project under
// `.build-work`. Only a build that finished, has a BUILD_ID and whose log shows no errors replaces `.next`; the
// replaced build stays in `.next.previous` for `npm run build:rollback`. Passenger is then asked to restart through
// `tmp/restart.txt`. A failed or interrupted build leaves the running site untouched.
//
// The build output is also written to `~/build-<date>-<time>.log` (BUILD_LOG_DIR overrides the folder). Next.js can
// finish with exit code 0 even when a page could not read the database, so the log is checked for BUILD_LOG_ERRORS
// before the new build is installed. BUILD_ALLOW_LOG_ERRORS=1 installs it anyway, after the log has been read.
//
// The build reads the database, so it first runs scripts/check-hosting-env.mjs: on the host it stops when another
// site's environment (or none) is active, and it prints the database it will read.
//
// Before building it also stops when the installed packages do not match package-lock.json (run `npm install` first)
// and, on the host, when no database backup was made in the last two hours (`bash scripts/backup-db.sh`;
// BUILD_WITHOUT_BACKUP=1 builds anyway). After a build, and after a rollback, it prints how to undo the deploy: the
// build, the database and the packages (scripts/deploy-status.mjs).
//
// Both sites share one hosting account and its memory, and two builds at once do not fit: on the host it also stops
// when another build (of either site, through this script or plain `next build`) is already running.

import { execFileSync, spawn } from "node:child_process";
import { cpSync, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { checkHostingEnv } from "./check-hosting-env.mjs";
import { BACKUP_MAX_AGE_MINUTES, backupProblem, currentCommit, packageMismatches, readLastBackup, recoveryLines } from "./deploy-status.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const excluded = new Set([".git", ".codex", ".agents", ".aws", ".impeccable", ".build-work", "uploads", "coverage"]);
/** Lines that mean a page was built from a broken database or crashed while being built. */
export const BUILD_LOG_ERRORS = /no such column|no such table|SQLITE|Error/;
const MATCHES_SHOWN = 10;
/** A process that is a build: this script (also its rollback) or Next.js's own `next build`. */
const BUILD_PROCESS = /build-hosting\.mjs|next build\b/;
/** Webpack's incremental cache inside a build. It names files by absolute path, so the build copy always has the same
 *  path (.build-work/source) and starts with the live build's cache: only what changed is compiled again. A site that
 *  turns the cache off for the hosting build (FK's next.config.ts under NEXT_LOW_MEMORY_BUILD) has none to reuse. */
const WEBPACK_CACHE = path.join(".next", "cache", "webpack");

/** This account's processes as `{ pid, elapsed, args }`, from `ps`. */
function listProcesses() {
  const output = execFileSync("ps", ["-u", String(process.getuid()), "-o", "pid=,etime=,args="], { encoding: "utf8" });
  return output.split("\n").map((line) => line.trim().match(/^(\d+)\s+(\S+)\s+(.+)$/)).filter(Boolean)
    .map(([, pid, elapsed, args]) => ({ pid: Number(pid), elapsed, args }));
}

/** Builds already running on the account, other than this one (its own process and the `sh -c` npm started it with). */
export function otherBuilds({ list = listProcesses, self = [process.pid, process.ppid] } = {}) {
  return list().filter(({ pid, args }) => !self.includes(pid) && BUILD_PROCESS.test(args));
}

function lockBuild(root) {
  const work = path.join(root, ".build-work");
  mkdirSync(work, { recursive: true, mode: 0o700 });
  const lock = path.join(work, "lock");
  try { mkdirSync(lock); } catch (error) {
    if (error.code === "EEXIST") throw new Error("Another build or rollback holds .build-work/lock. Check it before retrying.");
    throw error;
  }
  writeFileSync(path.join(lock, "pid"), String(process.pid));
  return { work, release: () => rmSync(lock, { recursive: true, force: true }) };
}

function restart(root) {
  mkdirSync(path.join(root, "tmp"), { recursive: true });
  writeFileSync(path.join(root, "tmp/restart.txt"), new Date().toISOString());
}

function promote(root, candidate, work) {
  const live = path.join(root, ".next");
  const previous = path.join(root, ".next.previous");
  const liveIsComplete = existsSync(path.join(live, "BUILD_ID"));
  const retired = path.join(work, "retired-build");
  const displaced = liveIsComplete ? previous : path.join(work, "incomplete-build");
  const hadLive = existsSync(live);
  const retirePrevious = liveIsComplete && existsSync(previous);
  if (retirePrevious) renameSync(previous, retired);
  try {
    if (hadLive) renameSync(live, displaced);
    try { renameSync(candidate, live); } catch (error) {
      if (hadLive) renameSync(displaced, live);
      throw error;
    }
  } catch (error) {
    if (retirePrevious) renameSync(retired, previous);
    throw error;
  }
  rmSync(retired, { recursive: true, force: true });
  if (!liveIsComplete) rmSync(displaced, { recursive: true, force: true });
}

/** Runs `next build`, showing its output and copying it into `logFile`. */
function runNext({ cwd, env, nextCli, logFile }) {
  return new Promise((resolve, reject) => {
    const log = createWriteStream(logFile, { flags: "a" });
    const child = spawn(process.execPath, [nextCli, "build", "--webpack"], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.on("data", (chunk) => { process.stdout.write(chunk); log.write(chunk); });
    child.stderr.on("data", (chunk) => { process.stderr.write(chunk); log.write(chunk); });
    const interrupt = (signal) => child.kill(signal);
    const onInterrupt = () => interrupt("SIGINT");
    const onTerminate = () => interrupt("SIGTERM");
    process.once("SIGINT", onInterrupt);
    process.once("SIGTERM", onTerminate);
    const cleanup = () => {
      process.removeListener("SIGINT", onInterrupt);
      process.removeListener("SIGTERM", onTerminate);
    };
    child.once("error", (error) => { cleanup(); log.end(); reject(error); });
    child.once("close", (code, signal) => { cleanup(); log.end(() => resolve({ code, signal })); });
  });
}

function logFileName(now) {
  const pad = (value) => String(value).padStart(2, "0");
  return `build-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.log`;
}

/** The log lines that match BUILD_LOG_ERRORS. */
export function findLogErrors(text) {
  return text.split(/\r?\n/).filter((line) => BUILD_LOG_ERRORS.test(line));
}

export async function buildForHosting({
  root = projectRoot,
  runBuild = runNext,
  heapMb = process.env.BUILD_HEAP_MB ?? "512",
  logDir = process.env.BUILD_LOG_DIR ?? homedir(),
  allowLogErrors = process.env.BUILD_ALLOW_LOG_ERRORS === "1",
  now = new Date(),
  checkEnv = (siteRoot) => checkHostingEnv({ root: siteRoot }),
  checkPackages = packageMismatches,
  readBackup = readLastBackup,
  allowNoBackup = process.env.BUILD_WITHOUT_BACKUP === "1",
  findBuilds = otherBuilds,
} = {}) {
  const heap = Number(heapMb);
  if (!Number.isInteger(heap) || heap < 256 || heap > 4096) throw new Error("BUILD_HEAP_MB must be an integer between 256 and 4096.");
  const { onHost, database } = checkEnv(root);
  console.log(`Database: ${database}`);
  console.log(`Code: ${currentCommit(root)}`);
  const mismatches = checkPackages(root);
  if (mismatches.length > 0) {
    throw new Error(`The installed packages do not match package-lock.json; nothing has been built or changed:\n`
      + `${mismatches.map((line) => `  ${line}`).join("\n")}\nRun npm install, then npm run build:hosting again.`);
  }
  const backup = readBackup(root);
  const missingBackup = onHost ? backupProblem(backup) : null;
  if (missingBackup && !allowNoBackup) {
    throw new Error(`${missingBackup} Nothing has been built or changed. Run bash scripts/backup-db.sh first `
      + `(it must be less than ${BACKUP_MAX_AGE_MINUTES} minutes old), or BUILD_WITHOUT_BACKUP=1 npm run build:hosting to build anyway.`);
  }
  if (backup) console.log(`Last backup: ${backup.ts} (${backup.ageMinutes} min ago).`);
  const running = onHost ? findBuilds() : [];
  if (running.length > 0) {
    throw new Error("Another build is running on this hosting account; both sites share its memory, so nothing has been "
      + `built or changed:\n${running.map(({ pid, elapsed, args }) => `  ${pid} (running ${elapsed}) ${args}`).join("\n")}\n`
      + "Wait until it ends, then run npm run build:hosting again.");
  }
  const { work, release } = lockBuild(root);
  let staging;
  try {
    // Whatever an interrupted build left here is stale; the lock above guarantees no build is using it.
    staging = path.join(work, "source");
    rmSync(staging, { recursive: true, force: true });
    mkdirSync(staging);
    for (const first of readdirSync(root)) {
      if (excluded.has(first) || first.startsWith(".next") || first.startsWith("node_modules")
        || first.endsWith(".tsbuildinfo") || first.endsWith(".log") || /^local\.db(?:-|$)/.test(first) || first === "tmp") continue;
      cpSync(path.join(root, first), path.join(staging, first), { recursive: true });
    }
    symlinkSync(realpathSync(path.join(root, "node_modules")), path.join(staging, "node_modules"), "dir");
    for (const name of ["local.db", "uploads"]) {
      if (existsSync(path.join(root, name))) symlinkSync(path.join(root, name), path.join(staging, name));
    }
    const inheritedOptions = (process.env.NODE_OPTIONS ?? "").replace(/--max[-_]old[-_]space[-_]size(?:=|\s+)\d+/g, "").trim();
    const env = {
      ...process.env,
      NEXT_LOW_MEMORY_BUILD: "1",
      NODE_OPTIONS: `${inheritedOptions} --max-old-space-size=${heap}`.trim(),
      RAYON_NUM_THREADS: "1",
      UV_THREADPOOL_SIZE: "1",
    };
    mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, logFileName(now));
    writeFileSync(logFile, "");
    const liveCache = path.join(root, WEBPACK_CACHE);
    const reusesCache = existsSync(liveCache);
    if (reusesCache) cpSync(liveCache, path.join(staging, WEBPACK_CACHE), { recursive: true });
    console.log(`Hosting build: ${heap} MB JavaScript heap per compiler process; one worker; `
      + (reusesCache ? "Webpack cache copied from the live build." : "no Webpack cache to reuse (a full build)."));
    console.log("Building separately; the live .next folder will only be replaced after success.");
    console.log(`Build log: ${logFile}`);
    const result = await runBuild({ cwd: staging, env, nextCli: path.join(root, "node_modules/next/dist/bin/next"), logFile });
    if (result.code !== 0 || result.signal) throw new Error(`Build failed (${result.signal ?? result.code}). The live .next folder has not been changed.`);
    const candidate = path.join(staging, ".next");
    if (!existsSync(path.join(candidate, "BUILD_ID"))) throw new Error("Build has no BUILD_ID; the live .next folder has not been changed.");
    const logErrors = findLogErrors(readFileSync(logFile, "utf8"));
    if (logErrors.length > 0) {
      const shown = logErrors.slice(0, MATCHES_SHOWN).map((line) => `  ${line}`).join("\n");
      if (!allowLogErrors) {
        throw new Error(`The build log has ${logErrors.length} error line(s); the live .next folder has not been changed:\n${shown}\n`
          + `Read ${logFile}. If these lines are harmless, run again with BUILD_ALLOW_LOG_ERRORS=1.`);
      }
      console.warn(`Installing despite ${logErrors.length} error line(s) in the log (BUILD_ALLOW_LOG_ERRORS=1):\n${shown}`);
    }
    promote(root, candidate, work);
    restart(root);
    console.log("Build installed; previous complete build retained in .next.previous; Passenger restart requested.");
    console.log(recoveryLines(root, backup).join("\n"));
  } finally {
    if (staging) rmSync(staging, { recursive: true, force: true });
    release();
  }
}

export function rollbackBuild(root = projectRoot) {
  const { work, release } = lockBuild(root);
  const live = path.join(root, ".next");
  const previous = path.join(root, ".next.previous");
  const swap = path.join(work, "rollback-build");
  try {
    if (!existsSync(path.join(previous, "BUILD_ID"))) throw new Error("No complete previous build is available.");
    const hadLive = existsSync(live);
    if (hadLive) renameSync(live, swap);
    try { renameSync(previous, live); } catch (error) {
      if (hadLive) renameSync(swap, live);
      throw error;
    }
    if (hadLive) renameSync(swap, previous);
    restart(root);
    console.log("Previous build restored; Passenger restart requested.");
    const backup = readLastBackup(root);
    console.log(backup?.restoreDatabase
      ? `The database was not changed. If this deploy ran db:migrate, restore it too: stop the app in Setup Node.js App, run: ${backup.restoreDatabase} — then start the app (copy ${backup.ts}).`
      : "The database was not changed, and no backup is recorded for this site.");
  } finally { release(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.includes("--rollback")) rollbackBuild();
    else await buildForHosting();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
