// Safety check before anything on the cPanel host touches the database: `npm run build:hosting` and
// `npm run db:migrate`. Shared by AFA Olaine and FK Olaine (same file in both repositories); see docs/hosting.md.
//
// On the host, `node` and `npm` are CloudLinux wrappers: each run loads the environment variables of the application
// whose environment was activated (`source ~/nodevenv/repositories/<app>/24/bin/activate`), including
// TURSO_DATABASE_URL, and names that application in CL_APP_ROOT. The shell itself never sees those variables. Two
// mistakes would therefore go unnoticed:
// - another site's environment is active (the prompt still shows it after `cd`): a migration would change that
//   site's database;
// - no environment is active: the database defaults to an empty ./local.db and a migration "succeeds" on it.
// Both stop here. Off the host (no ~/nodevenv) the check only reports the database. With --require-backup (used by
// `npm run db:migrate`) it also stops on the host when no database backup was made in the last two hours.

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { BACKUP_MAX_AGE_MINUTES, backupProblem, readLastBackup } from "./deploy-status.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
/** A database on the host must be an absolute file or a remote libSQL URL, never the relative development default. */
const HOST_DATABASE = /^(file:\/|libsql:\/\/|https:\/\/)/;

function realOrSelf(target) {
  try { return realpathSync(target); } catch { return path.resolve(target); }
}

/** TURSO_DATABASE_URL from the environment, else from a local env file (as Next.js and dotenv would read it). */
function databaseUrl(root, env) {
  if (env.TURSO_DATABASE_URL) return env.TURSO_DATABASE_URL;
  for (const name of [".env.production.local", ".env.local", ".env.production", ".env"]) {
    const file = path.join(root, name);
    if (!existsSync(file)) continue;
    const match = /^TURSO_DATABASE_URL=(.+)$/m.exec(readFileSync(file, "utf8"));
    if (match) return match[1].trim();
  }
  return null;
}

/** Throws with what to do when the host environment does not belong to this site; returns what it found. */
export function checkHostingEnv({ root = projectRoot, env = process.env, home = homedir() } = {}) {
  const onHost = existsSync(path.join(home, "nodevenv"));
  const database = databaseUrl(root, env);
  if (!onHost) return { onHost, database: database ?? "file:./local.db (development default)" };

  const site = path.basename(realOrSelf(root));
  if (!env.CL_APP_ROOT) {
    throw new Error(`No hosting environment is active. Run: source ~/nodevenv/repositories/${site}/24/bin/activate`);
  }
  const appRoot = path.isAbsolute(env.CL_APP_ROOT) ? env.CL_APP_ROOT : path.join(home, env.CL_APP_ROOT);
  if (realOrSelf(appRoot) !== realOrSelf(root)) {
    throw new Error(`The active environment belongs to ${path.basename(appRoot)}, but this is ${site}. `
      + `Open a new terminal and run: source ~/nodevenv/repositories/${site}/24/bin/activate`);
  }
  if (!database || !HOST_DATABASE.test(database)) {
    throw new Error(`TURSO_DATABASE_URL is ${database ? `"${database}"` : "not set"} for ${site}. `
      + "Set it in Setup Node.js App to the site's database before building or migrating.");
  }
  return { onHost, database };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { onHost, database } = checkHostingEnv();
    // `npm run db:migrate` passes --require-backup: a migration changes the live database, so it needs a fresh copy.
    const missingBackup = onHost && process.argv.includes("--require-backup") ? backupProblem(readLastBackup(projectRoot)) : null;
    if (missingBackup) {
      throw new Error(`${missingBackup} Run bash scripts/backup-db.sh first (it must be less than ${BACKUP_MAX_AGE_MINUTES} minutes old).`);
    }
    console.log(`Hosting check passed. Database: ${database}`);
  } catch (error) {
    console.error(`Stopped: ${error.message}`);
    process.exitCode = 1;
  }
}
