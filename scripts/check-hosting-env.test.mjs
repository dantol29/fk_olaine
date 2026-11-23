import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { checkHostingEnv } from "./check-hosting-env.mjs";

const HOST_DB = "file:/home/club/afa_olaine-data/app.db";

function host() {
  const home = mkdtempSync(path.join(tmpdir(), "hosting-env-"));
  mkdirSync(path.join(home, "nodevenv"));
  for (const site of ["afa_olaine", "fk_olaine_code"]) mkdirSync(path.join(home, "repositories", site), { recursive: true });
  return { home, root: path.join(home, "repositories", "afa_olaine") };
}

test("the site's own environment passes and reports its database", () => {
  const { home, root } = host();
  try {
    assert.deepEqual(checkHostingEnv({ root, home, env: { CL_APP_ROOT: "repositories/afa_olaine", TURSO_DATABASE_URL: HOST_DB } }), { onHost: true, database: HOST_DB });
    assert.equal(checkHostingEnv({ root, home, env: { CL_APP_ROOT: root, TURSO_DATABASE_URL: HOST_DB } }).database, HOST_DB);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("another site's environment stops it", () => {
  const { home, root } = host();
  try {
    assert.throws(
      () => checkHostingEnv({ root, home, env: { CL_APP_ROOT: "repositories/fk_olaine_code", TURSO_DATABASE_URL: "file:/home/club/fk_olaine-data/app.db" } }),
      /belongs to fk_olaine_code, but this is afa_olaine[\s\S]*nodevenv\/repositories\/afa_olaine\/24\/bin\/activate/,
    );
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("no active environment, or no real database, stops it on the host", () => {
  const { home, root } = host();
  try {
    assert.throws(() => checkHostingEnv({ root, home, env: {} }), /No hosting environment is active/);
    assert.throws(() => checkHostingEnv({ root, home, env: { CL_APP_ROOT: "repositories/afa_olaine" } }), /not set/);
    assert.throws(() => checkHostingEnv({ root, home, env: { CL_APP_ROOT: "repositories/afa_olaine", TURSO_DATABASE_URL: "file:./local.db" } }), /file:\.\/local\.db/);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("off the host it only reports the database, from the environment or a local env file", () => {
  const home = mkdtempSync(path.join(tmpdir(), "dev-home-"));
  const root = mkdtempSync(path.join(tmpdir(), "dev-site-"));
  try {
    assert.equal(checkHostingEnv({ root, home, env: {} }).database, "file:./local.db (development default)");
    writeFileSync(path.join(root, ".env.local"), "SITE_URL=http://localhost:3000\nTURSO_DATABASE_URL=file:./local.db\n");
    assert.deepEqual(checkHostingEnv({ root, home, env: {} }), { onHost: false, database: "file:./local.db" });
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
});
