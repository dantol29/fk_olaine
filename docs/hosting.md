# Hosting: how AFA Olaine and FK Olaine run on the cPanel account

Both sites run on one cPanel account as Node.js applications (CloudLinux "Setup Node.js App", Phusion Passenger,
`server.js` → `next start`). This file is the same in both repositories. Paths are relative to the account's home
folder (`~`). Facts marked *checked* were seen on the server on 2026-11-23; values of secrets are never written here.

## Where things are

| | AFA Olaine | FK Olaine |
| --- | --- | --- |
| Application folder (the code the site runs from, a git checkout of `main`) | `~/repositories/afa_olaine` | `~/repositories/fk_olaine_code` |
| Node.js environment (Node 24) | `~/nodevenv/repositories/afa_olaine/24` | `~/nodevenv/repositories/fk_olaine_code/24` |
| Database (`TURSO_DATABASE_URL`) | `~/afa_olaine-data/app.db` | `~/fk_olaine-data/app.db` |
| Database backups (`scripts/backup-db.sh`) | `~/afa_olaine-backups` | `~/fk_olaine-backups` |
| Build logs (`npm run build:hosting`) | `~/build-<date>-<time>.log` | same |

- *Checked:* FK is deployed from the terminal in `~/repositories/fk_olaine_code`. The cPanel Git copy
  `~/repositories/fk_olaine` is empty and not used; `.cpanel.yml` describes that unused route.
- *Checked:* on the FK server copy `package-lock.json` is modified locally (dependency installs on the host); it is
  stashed before `git pull`. Untracked leftovers (`--get`, `--data-urlencode`, `node_modules.backup/`) are harmless.
- `UPLOADS_DIR` is `public/uploads` for both sites, i.e. inside the application folder (*not yet checked* whether it is
  a link to a folder outside it). Never delete or rsync over it.

## Settings (environment variables)

Set only in **Setup Node.js App** of each site. There are no `.env` files in the application folders (*checked*).

- AFA Olaine: `ADMIN_PASSWORD`, `CRON_SECRET`, `NODE_AUTH_TOKEN`, `SESSION_SECRET`, `SHARED_CALENDAR_SECRET`,
  `SITE_URL`, `SMTP_HOST`, `SMTP_PASSWORD`, `SMTP_PORT`, `SMTP_USER`, `TURSO_DATABASE_URL`, `UPLOADS_DIR`.
- FK Olaine: the same names plus `AFA_CALENDAR_URL` and `NODE_ENV=production`.
- Both sites must have the same `SHARED_CALENDAR_SECRET` (see `docs/shared-calendar.md`).

## How terminal commands see the settings

`node` and `npm` in an activated environment are CloudLinux wrappers (`~/nodevenv/.../bin/node` → a wrapper that runs
`set_env_vars.py nodejs`, then the real Node). *Checked:*

- the shell does not see the settings: `echo $TURSO_DATABASE_URL` prints nothing;
- every `node`/`npm` run does: `node -e 'console.log(process.env.TURSO_DATABASE_URL)'` prints the site's database.
  So `npm run build:hosting`, `npm run db:migrate` and any `node` script get the site's settings automatically;
- the wrapper also sets `CL_APP_ROOT` (the application of the activated environment), `CL_VIRTUAL_ENV` and
  `CL_NODEHOME`;
- the settings come from **the activated environment, not the current folder**. After
  `source ~/nodevenv/repositories/fk_olaine_code/24/bin/activate` and `cd ~/repositories/afa_olaine`, Node gets FK's
  settings, so an AFA migration would change FK's database. The prompt shows the active environment, e.g.
  `[repositories/fk_olaine_code (24)]`.

`scripts/check-hosting-env.mjs` (shared) guards against this. `npm run build:hosting` and `npm run db:migrate` run it
first; on the host it stops when no environment or another site's environment is active, or when the database is not
an absolute path, and prints the database it will use. Run it alone with `node scripts/check-hosting-env.mjs`.

Always start a deploy in a new terminal with the site's own environment:

```bash
source ~/nodevenv/repositories/afa_olaine/24/bin/activate && cd ~/repositories/afa_olaine        # AFA Olaine
source ~/nodevenv/repositories/fk_olaine_code/24/bin/activate && cd ~/repositories/fk_olaine_code  # FK Olaine
```

## Building

- Use `npm run build:hosting`, never plain `npm run build`, on the host (`scripts/build-hosting.mjs`, shared). It builds
  in `.build-work`, installs the new `.next` only after success and a clean log, keeps the previous build in
  `.next.previous` (`npm run build:rollback`) and restarts Passenger through `tmp/restart.txt`.
- The build reads the database: pages such as `/sitemap.xml`, `/feed.xml` and the home page are prerendered. Without
  the database the build stops with "no such table" (*checked* on a copy).
- A deploy is confirmed by `.next/BUILD_ID`: a new value with today's time (FK, *checked*: `Y8Sz8w8-…` of 2026-11-13
  became `6cz5Cr8Wt1K-…` at 2026-11-23 11:14).
- Normal noise in the build output on this host: `GLIBC_2.29 not found` and `invalid ELF header` (the native compiler
  cannot load; Next.js falls back to WASM, so builds take 5–10 minutes), "multiple lockfiles" (the separate build
  copy), "Retrying 1/3…", "Retrying 2/3…" and `write EPIPE` (a build worker hit the account's limits and was retried).
- FK's build printed "AFA shared calendar could not be loaded" (*checked*): FK's pages built ahead read AFA's feed and
  fall back without it; the running site shows AFA's entries (*checked* on `/kalendars`).

## Database changes

1. Back up: `bash scripts/backup-db.sh` (prints `TS` and the rollback command).
2. `npm run db:migrate` (checked environment first; the shared migrations are idempotent).
3. Build as above. Rolling the build back does not roll the database back; restore the backup for that (stop the app
   in Setup Node.js App, `cp -p` the backup over `app.db`, start the app).

## Not yet checked

- Scheduled jobs (`crontab -l`): the LFF fixture and top-scorer sync, and whether any backup runs on a schedule.
- Where `public/uploads` really points for each site.
- Free disk space and the account quota.
