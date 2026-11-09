import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildForHosting, rollbackBuild } from "./build-hosting.mjs";

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
    await assert.rejects(buildForHosting({ root, runBuild: async ({ cwd, env }) => {
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
    await buildForHosting({ root, runBuild: async ({ cwd }) => {
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
    await assert.rejects(buildForHosting({ root, runBuild: async () => ({ code: 0, signal: null }) }), /BUILD_ID/);
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "working-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("replacing an incomplete live build preserves the last complete rollback", async () => {
  const root = fixture();
  try {
    rmSync(path.join(root, ".next/BUILD_ID"));
    mkdirSync(path.join(root, ".next.previous"));
    writeFileSync(path.join(root, ".next.previous/BUILD_ID"), "last-working-build");
    await buildForHosting({ root, runBuild: async ({ cwd }) => {
      mkdirSync(path.join(cwd, ".next"));
      writeFileSync(path.join(cwd, ".next/BUILD_ID"), "recovered-build");
      return { code: 0, signal: null };
    } });
    assert.equal(readFileSync(path.join(root, ".next/BUILD_ID"), "utf8"), "recovered-build");
    assert.equal(readFileSync(path.join(root, ".next.previous/BUILD_ID"), "utf8"), "last-working-build");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
