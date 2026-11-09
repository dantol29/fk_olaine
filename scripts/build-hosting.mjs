import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const excluded = new Set([".git", ".codex", ".agents", ".aws", ".impeccable", ".build-work", "uploads", "coverage"]);

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

function runNext({ cwd, env, nextCli }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextCli, "build", "--webpack"], { cwd, env, stdio: "inherit" });
    const interrupt = (signal) => child.kill(signal);
    const onInterrupt = () => interrupt("SIGINT");
    const onTerminate = () => interrupt("SIGTERM");
    process.once("SIGINT", onInterrupt);
    process.once("SIGTERM", onTerminate);
    const cleanup = () => {
      process.removeListener("SIGINT", onInterrupt);
      process.removeListener("SIGTERM", onTerminate);
    };
    child.once("error", (error) => { cleanup(); reject(error); });
    child.once("exit", (code, signal) => { cleanup(); resolve({ code, signal }); });
  });
}

export async function buildForHosting({ root = projectRoot, runBuild = runNext, heapMb = process.env.BUILD_HEAP_MB ?? "512" } = {}) {
  const heap = Number(heapMb);
  if (!Number.isInteger(heap) || heap < 256 || heap > 4096) throw new Error("BUILD_HEAP_MB must be an integer between 256 and 4096.");
  const { work, release } = lockBuild(root);
  let staging;
  try {
    staging = mkdtempSync(path.join(work, "source-"));
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
    console.log(`Hosting build: ${heap} MB JavaScript heap per compiler process; one worker; Webpack cache disabled.`);
    console.log("Building separately; the live .next folder will only be replaced after success.");
    const result = await runBuild({ cwd: staging, env, nextCli: path.join(root, "node_modules/next/dist/bin/next") });
    if (result.code !== 0 || result.signal) throw new Error(`Build failed (${result.signal ?? result.code}). The live .next folder has not been changed.`);
    const candidate = path.join(staging, ".next");
    if (!existsSync(path.join(candidate, "BUILD_ID"))) throw new Error("Build has no BUILD_ID; the live .next folder has not been changed.");
    promote(root, candidate, work);
    restart(root);
    console.log("Build installed; previous complete build retained in .next.previous; Passenger restart requested.");
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
