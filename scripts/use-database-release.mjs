import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const version = process.argv[2] ?? "0.1.0";
if (!/^\d+\.\d+\.\d+(?:-[\da-z.-]+)?$/i.test(version)) throw new Error("Provide an exact package version, such as 0.1.0.");
if (process.argv.includes("--token-stdin")) {
  const input = createInterface({ input: process.stdin, terminal: false });
  process.env.NODE_AUTH_TOKEN = await new Promise((resolve, reject) => {
    let received = false;
    input.once("line", (line) => { received = true; resolve(line.trim()); input.close(); });
    input.once("close", () => { if (!received) reject(new Error("No token received on stdin.")); });
    input.once("error", reject);
  });
}
if (!process.env.NODE_AUTH_TOKEN) throw new Error("Set NODE_AUTH_TOKEN to a GitHub token (classic) with read:packages before installing the private release.");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const secondApp = process.argv.slice(3).find((value) => !value.startsWith("--"));
const targets = [root, path.resolve(secondApp ?? path.join(root, "../afaolaine_website"))];
for (const target of targets) {
  if (!existsSync(path.join(target, "package.json"))) throw new Error(`Application not found: ${target}`);
}
// Authenticate via an environment placeholder only. Never write a token to disk.
for (const target of new Set(targets)) {
  const npmrc = path.join(target, ".npmrc");
  const existing = existsSync(npmrc) ? readFileSync(npmrc, "utf8") : "";
  const lines = existing.split("\n").filter((line) => !line.startsWith("@dantol29:registry=") && !line.startsWith("//npm.pkg.github.com/:_authToken="));
  writeFileSync(npmrc, lines.join("\n").trimEnd() + "\n@dantol29:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n");
  const result = spawnSync("npm", ["install", "--save-exact", `@olaine/database@npm:@dantol29/database@${version}`, "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: target, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Private package installation failed in ${target}. Check package-read permission.`);
  const file = path.join(target, "package.json");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  delete manifest.scripts["db:share"];
  if (target === root) manifest.scripts["db:update-shared"] = "node scripts/use-database-release.mjs";
  writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Installed the pinned shared database release ${version} in ${target}`);
}
