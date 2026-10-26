const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const S = require("../src");
const bin = path.join(__dirname, "../bin/sizecheck.js");
const fx = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), "sc-")); fs.mkdirSync(path.join(d, "dist/a"), { recursive: true }); fs.writeFileSync(path.join(d, "dist/a.js"), "x".repeat(5000)); fs.writeFileSync(path.join(d, "dist/a/b.js"), "y".repeat(3000)); fs.writeFileSync(path.join(d, "dist/s.css"), "a{}"); return d; };

test("parseSize", () => { assert.equal(S.parseSize("10kB"), 10000); assert.equal(S.parseSize("1.5 MiB"), 1572864); assert.equal(S.parseSize(42), 42); assert.throws(() => S.parseSize("big")); });
test("globs", () => {
  const d = fx();
  assert.deepEqual(S.resolve(d, "dist/**/*.js").sort(), ["dist/a.js", "dist/a/b.js"]);
  assert.deepEqual(S.resolve(d, "dist/*.js"), ["dist/a.js"]);
  assert.deepEqual(S.resolve(d, ["dist/**/*.{js,css}", "!dist/a/b.js"]).sort(), ["dist/a.js", "dist/s.css"]);
  assert.deepEqual(S.resolve(d, "dist").length, 3);
});
test("check + measure", () => {
  const d = fx();
  const r = S.check(d, [{ name: "js", path: "dist/**/*.js", limit: 10, compression: "none" }, { name: "gz", path: "dist/**/*.js", limit: 1000, compression: "gzip" }, { name: "none", path: "x/*.js", limit: 1, compression: "gzip" }]);
  assert.equal(r[0].raw, 8000); assert.equal(r[0].pass, false); assert.equal(r[1].pass, true); assert.ok(r[1].gzip < 200); assert.equal(r[2].missing, true);
});
test("cli: config, exit codes, baseline", () => {
  const d = fx();
  assert.equal(spawnSync("node", [bin, "--cwd", d]).status, 2);
  assert.equal(spawnSync("node", [bin, "--cwd", d, "--init"]).status, 0);
  fs.writeFileSync(path.join(d, ".sizecheckrc.json"), JSON.stringify([{ path: "dist/**/*.js", limit: "1 kB" }]));
  let r = spawnSync("node", [bin, "--cwd", d, "--save"], { encoding: "utf8" }); assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, /All budgets pass/);
  fs.writeFileSync(path.join(d, "dist/a.js"), require("node:crypto").randomBytes(3000));
  r = spawnSync("node", [bin, "--cwd", d, "--json"], { encoding: "utf8" }); assert.equal(r.status, 1); const j = JSON.parse(r.stdout); assert.equal(j.pass, false); assert.ok(j.results[0].delta > 0);
  assert.equal(spawnSync("node", [bin, "dist/*.css", "-l", "1kB", "--cwd", d]).status, 0);
  assert.equal(spawnSync("node", [bin, "dist/*.css", "-l", "huge", "--cwd", d]).status, 2);
});
