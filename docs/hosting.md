# Hosting: how AFA Olaine and FK Olaine run on the cPanel account

Both sites run on one cPanel account as Node.js applications (CloudLinux "Setup Node.js App", Phusion Passenger,
`server.js` → `next start`). This file is the same in both repositories. Paths are relative to the account's home
folder (`~`). Facts marked *checked* were seen on the server on the date given; values of secrets are never written
here.

## Where things are

| | AFA Olaine | FK Olaine |
| --- | --- | --- |
| Application folder (the code the site runs from, a git checkout of `main`) | `~/repositories/afa_olaine` | `~/repositories/fk_olaine_code` |
| Node.js environment (Node 24) | `~/nodevenv/repositories/afa_olaine/24` | `~/nodevenv/repositories/fk_olaine_code/24` |
| Database (`TURSO_DATABASE_URL`) | `~/afa_olaine-data/app.db` | `~/fk_olaine-data/app.db` |
| Database copies and photo archives (`scripts/backup-db.sh`) | `~/afa_olaine-backups` | `~/fk_olaine-backups` |
| Uploaded photos (`UPLOADS_DIR=public/uploads`) | `~/repositories/afa_olaine/public/uploads` | `~/repositories/fk_olaine_code/public/uploads` |
| Build logs (`npm run build:hosting`) | `~/build-<date>-<time>.log` | same |
| Application log (Passenger) | `~/logs/afa_passenger.log` | not located yet |
| Request log (Apache) | `~/access-logs/afaolaine.lv-ssl_log` | `~/access-logs/fkolaine.com.afaolaine.lv-ssl_log` |

- *Checked 2026-11-23:* FK is deployed from the terminal in `~/repositories/fk_olaine_code`. The cPanel Git copy
  `~/repositories/fk_olaine` is empty and not used; `.cpanel.yml` describes that unused route.
- *Checked 2026-11-24:* on the FK server copy `package-lock.json` is modified locally (dependency installs on the
  host); it is stashed before `git pull` only when the pull touches it. Untracked leftovers (`--get`,
  `--data-urlencode`, `node_modules.backup/`) are harmless.
- *Checked 2026-11-23:* the uploaded photos are ordinary folders inside the application folders (not links). They are
  untracked by git, so `git pull` leaves them alone, but never run `git clean -fdx` or an rsync with `--delete` over an
  application folder. `scripts/backup-db.sh` archives them.
- The two sites share no data at run time: neither reads the other's calendar or database. Only the database schema
  package (`@olaine/database`) is shared.

## Account limits

*Checked 2026-11-24* in cPanel → **Resource Usage**. Both sites, the build and everything else on the account share:

- **memory: 2 GB** in total. Each site's Passenger process takes about 270–290 MB;
- **CPU: one core** (100%). A build uses all of it, so the other site slows down meanwhile;
- **files (inodes): 250,000**, of which about 235,000 were used. Most are in `~/nodevenv` (both sites' packages),
  `~/public_html`, `~/repositories/fk_olaine_code` (mostly `node_modules.backup/`) and the npm cache `~/.npm`;
- processes 750, entry processes 150, disk I/O 5 MB/s.

"Faults" in Resource Usage mark the hours when a limit was hit. Each site runs as **one** Passenger process
(`ps -u "$USER" -o pid,etime,rss,args`); Passenger stops it after a while without visitors and starts it again on
the next request, which then takes a few seconds longer.

## Settings (environment variables)

Set only in **Setup Node.js App** of each site. There are no `.env` files in the application folders (*checked*).

- Both sites: `ADMIN_PASSWORD`, `CRON_SECRET`, `NODE_AUTH_TOKEN`, `SESSION_SECRET`, `SITE_URL`, `SMTP_HOST`,
  `SMTP_PASSWORD`, `SMTP_PORT`, `SMTP_USER`, `TURSO_DATABASE_URL`, `UPLOADS_DIR`. FK also sets `NODE_ENV=production`.
- `SHARED_CALENDAR_SECRET` (both) and `AFA_CALENDAR_URL` (FK) are left over from the calendar exchange between the
  sites, which was removed in November 2026. No code reads them; they can be deleted from the settings.

## How terminal commands see the settings

`node` and `npm` in an activated environment are CloudLinux wrappers (`~/nodevenv/.../bin/node` → a wrapper that runs
`set_env_vars.py nodejs`, then the real Node). *Checked:*

- the shell does not see the settings: `echo $TURSO_DATABASE_URL` prints nothing;
- every `node`/`npm` run does: `node -e 'console.log(process.env.TURSO_DATABASE_URL)'` prints the site's database.
  So `npm run build:hosting`, `npm run db:migrate` and any `node` script get the site's settings automatically;
- the wrapper also sets `CL_APP_ROOT` (the activated application, relative to the home folder, e.g.
  `repositories/afa_olaine`), `CL_VIRTUAL_ENV` (e.g. `~/nodevenv/repositories/afa_olaine/24`) and `CL_NODEHOME`. Node gets
  `NODE_ENV=production` for both sites;
- the settings come from **the activated environment, not the current folder**. After
  `source ~/nodevenv/repositories/fk_olaine_code/24/bin/activate` and `cd ~/repositories/afa_olaine`, Node gets FK's
  settings, so an AFA migration would change FK's database. The prompt shows the active environment, e.g.
  `[repositories/fk_olaine_code (24)]`. A new or reconnected terminal has no environment active.

`scripts/check-hosting-env.mjs` (shared) guards against this. `npm run build:hosting` and `npm run db:migrate` run it
first; on the host it stops when no environment or another site's environment is active, or when the database is not
an absolute path, and prints the database it will use. Run it alone with `node scripts/check-hosting-env.mjs`.

Always start a deploy with the site's own environment:

```bash
source ~/nodevenv/repositories/afa_olaine/24/bin/activate && cd ~/repositories/afa_olaine        # AFA Olaine
source ~/nodevenv/repositories/fk_olaine_code/24/bin/activate && cd ~/repositories/fk_olaine_code  # FK Olaine
```

## Building

- Use `npm run build:hosting`, never plain `npm run build`, on the host (`scripts/build-hosting.mjs`, shared). It builds
  in `.build-work`, installs the new `.next` only after success and a clean log, keeps the previous build in
  `.next.previous` (`npm run build:rollback`) and restarts Passenger through `tmp/restart.txt`.
- **One build at a time on the whole account.** Both developers deploy to it, and two builds (or a build while the
  other site is busy) do not fit into the 2 GB. Before building, check that no build runs:
  `ps -u "$USER" -o pid,etime,args | grep -E 'build-hosting|next build' | grep -v grep` must print nothing.
- **Run it in the background**, so a closed or reloaded terminal page does not cut it off, and follow the output:

  ```bash
  nohup npm run build:hosting > ~/deploy-<site>.out 2>&1 & sleep 2; tail -f ~/deploy-<site>.out
  ```

  Ctrl+C stops only `tail`; `tail -40 ~/deploy-<site>.out` shows the result later.
- **Memory settings.** Both sites' `next.config.ts` use the same low-memory profile (`cpus: 1`,
  `webpackMemoryOptimizations`, `webpackBuildWorker`, `staticGenerationMaxConcurrency: 1`,
  `staticGenerationMinPagesPerWorker: 50`) and turn Webpack's filesystem cache off when `NEXT_LOW_MEMORY_BUILD=1`, which
  `build-hosting.mjs` sets together with a 512 MB heap per compiler process (`BUILD_HEAP_MB`). *Checked 2026-11-24:*
  AFA's build without this profile, with and without a reused cache, was killed (`Next.js build worker exited with
  code: null and signal: SIGKILL`) while FK was running; with it, it passed. A `SIGKILL` therefore means memory: check
  that nothing else builds, then try again.
- Build time: every build compiles everything, about 4–5 minutes plus checks (*checked* 2026-11-24 on both sites).
- The build reads the database: pages such as `/sitemap.xml`, `/feed.xml` and the home page are prerendered. Without
  the database the build stops with "no such table" (*checked* on a copy).
- A deploy is confirmed by `.next/BUILD_ID`: a new value with today's time.
- Normal noise in the build output on this host: `GLIBC_2.29 not found` and `invalid ELF header` (the native compiler
  cannot load; Next.js falls back to WASM), "multiple lockfiles" (the separate build copy), "Retrying 1/3…",
  "Retrying 2/3…" and `write EPIPE` (a build worker hit the account's limits and was retried).
- Before building it stops, changing nothing, when the shared database package is not installed in the version
  `package.json` pins (run `npm install`) or, on the host, when no database backup was made in the last two hours (run
  `bash scripts/backup-db.sh`; `BUILD_WITHOUT_BACKUP=1 npm run build:hosting` builds anyway). It prints the database,
  the commit it builds and the last backup.
- Only the database package is checked. *Checked* on 2026-11-24: the host's npm (CloudLinux) ignores
  `package-lock.json`: it installs the newest versions `package.json` allows (AFA had `lucide-react` 1.48.0 against
  1.40.0 in the lockfile, FK built with Next.js 16.3.8) and leaves some dev tools out (`eslint`). The sites always ran
  like that, so comparing every package with the lockfile stopped every build.
- `npm run build:hosting` does not install packages. Install them after `git pull` when `package.json` or
  `package-lock.json` changed (`git diff --stat HEAD@{1} -- package.json package-lock.json` shows it). On 2026-11-23
  `npm install` worked for both sites; FK's README recommends Node.js Selector's installer instead (**Run NPM Install**
  or `cloudlinux-selector install-modules`) because plain npm may replace the `node_modules` link — *to confirm with
  the FK developer which one to use*. The database package is built into the site (`transpilePackages`), so
  installing a new one does not affect the running build; a new Next.js or React would, until the new build is
  installed.
- If "Another build or rollback holds .build-work/lock" appears and no build is running (the `ps` command above),
  remove `.build-work/lock`; its `pid` file names the process that took it.
- While one site builds, the other can answer 500 for moments (*seen* 2026-11-24 on AFA during FK's build). Deploy at
  a quiet time, finish and check one site, then start the other.

## Backups

`bash scripts/backup-db.sh` (shared; only the default folders differ) copies the database with the date and time in
the name and packs the photos into `uploads.<date-time>.tar.gz`, keeping the newest 100 database copies and the newest
10 photo archives; it prints the commands to restore both and records them in `.last-backup` in the application folder,
where `npm run build:hosting` and `npm run db:migrate` look for a backup less than two hours old. Run it before every
deploy. Nothing runs it on a schedule.

The database copy keeps the original file's modification time (`cp -p`), so in File Manager it shows when the
database was last written (often the LFF sync at :15), not when the copy was made; the time of the copy is in its
name.

## Scheduled jobs

*Checked* (`crontab -l`): every 6 hours at :15 the LFF fixture sync (`POST /api/cron/sync-fixtures` with
`CRON_SECRET`) runs for each site, logging to `~/cron-sync.log` (FK) and `~/cron-sync_afa_olaine.log` (AFA). The
top-scorer sync is not scheduled.

## Database changes

1. Back up: `bash scripts/backup-db.sh` (prints `TS` and the rollback command).
2. Install packages if `package-lock.json` changed (a new database release always changes it).
3. `npm run db:migrate` (checks the environment and a fresh backup first; the shared migrations are idempotent).
4. Build as above. Between the migration and the new build the old build runs on the migrated database, so pages that
   read a changed table may fail for those minutes: deploy at a quiet time.

## Rolling back

`npm run build:hosting` prints these steps after every build, with the real commit and backup filled in; `npm run
build:rollback` prints the database step again.

- **Build**, in seconds: `npm run build:rollback` swaps `.next` and `.next.previous`. It does not touch the database or
  the packages.
- **Database**, only when the deploy ran `db:migrate` (an old build cannot read a migrated database): stop the app in
  Setup Node.js App, run the `DB_RESTORE` command from `.last-backup` (it removes the newer `-journal`/`-wal`/`-shm`
  files before copying the backup, so SQLite does not replay them onto it), start the app.
- **Code and packages together**: `git checkout <commit before the deploy> && npm install && npm run build:hosting`
  (the build prints that commit; `git reflog` shows it too), and later `git checkout main`.

## When the site misbehaves

Where to look:

- **Requests with time and status:** `~/access-logs/<domain>-ssl_log` (table above). For example, everything one
  address sent around a time:
  `grep -h '<IP>' ~/access-logs/afaolaine.lv* | awk '$4 >= "[24/Nov/2026:12:58:30" && $4 <= "[24/Nov/2026:12:59:30"'`.
- **Refusals by the web server:** cPanel → **Errors**.
- **Limits hit:** cPanel → **Resource Usage** (faults per hour).
- **The application's own errors:** the Passenger log (table above). Its lines have no time. Harmless repeats there:
  `The Server Reference ID did not match the expected format` (bots probing Next.js sites for an old vulnerability),
  `failed to get redirect response … fetch failed` (after an admin save the app cannot call itself on this host; the
  browser then loads the page itself). `The client reference manifest … does not exist`, `500.html ENOENT` and
  `i[a] is not a function` come from requests served while a new build was being installed.
- To tell the site from the visitor's connection, request the page from the server itself
  (`curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/`) while it fails in the browser.

### "404 This page could not be found" for everything, for about 30 seconds

*Checked 2026-11-24 on AFA.* The host's flood protection refuses every request from an address that sent too many
in a short time, for about 30 seconds (cPanel → Errors: `client denied by server configuration`). Apache's error page
for that refusal, `/403.shtml`, is passed to the Next.js app, which has no such page and answers 404. Signs: the page
source of the 404 contains `"403.shtml"`; the same page requested from the server answers 200; everyone behind the
same address sees the 404 at once, including on the public pages.

The trigger was the admin: Next.js prefetches every visible link and does it again after each save, so one save sent
about 40 requests within a second, and three or four saves in a row got the address blocked. Admin links therefore
never prefetch: each site has `AdminLink` (`src/components/admin/admin-link.tsx`, `next/link` with `prefetch={false}`),
and a test keeps admin code off plain `next/link`. The public pages still prefetch; no visitor has reported a block.

## Disk

*Checked 2026-11-23:* the shared volume has about 214 GB free (79% used); the account's home folder takes 29 GB. The
limit that matters is the number of files (see "Account limits").
