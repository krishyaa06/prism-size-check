#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("node:util");
const S = require("../src");
const { c, header, table, plural } = require("../src/ui");
const pkg = require("../package.json");

const HELP = `${header("sizecheck", "size budgets for your bundles")}

${c.bold("Usage")}
  sizecheck                          check budgets from .sizecheckrc.json / package.json "sizecheck"
  sizecheck "dist/**/*.js" -l 50kB   ad-hoc check (each file)
  sizecheck --init                   write a starter .sizecheckrc.json

${c.bold("Options")}
  -l, --limit <size>     budget for ad-hoc patterns (10kB, 1.5MB, 200KiB)
  -c, --compression <c>  gzip (default) | brotli | none
      --total            ad-hoc: sum files instead of checking each
      --save             store current sizes as baseline (.sizecheck-baseline.json)
      --json             machine-readable output
  -v, --version / -h, --help

Exit code 1 when a budget is exceeded — drop it in CI.`;

let a;
try { a = parseArgs({ allowPositionals: true, options: { limit: { type: "string", short: "l" }, compression: { type: "string", short: "c" }, total: { type: "boolean" }, save: { type: "boolean" }, json: { type: "boolean" }, init: { type: "boolean" }, cwd: { type: "string" }, version: { type: "boolean", short: "v" }, help: { type: "boolean", short: "h" } } }); }
catch (e) { console.error(c.red(`✖ ${e.message}`)); process.exit(2); }
const o = a.values;
if (o.help) { console.log(HELP); process.exit(0); }
if (o.version) { console.log(pkg.version); process.exit(0); }
const root = path.resolve(o.cwd || ".");
if (o.init) {
  const f = path.join(root, ".sizecheckrc.json");
  if (fs.existsSync(f)) { console.error(c.yellow("⚠ .sizecheckrc.json already exists")); process.exit(1); }
  fs.writeFileSync(f, JSON.stringify([{ name: "JS bundle", path: "dist/**/*.js", limit: "100 kB", compression: "gzip" }, { name: "CSS", path: "dist/**/*.css", limit: "20 kB" }, { name: "Images", path: "dist/**/*.{png,jpg,webp,svg}", limit: "300 kB", compression: "none", each: true }], null, 2) + "\n");
  console.log(`${c.green("✔")} Wrote ${c.bold(".sizecheckrc.json")} ${c.dim("— edit the budgets, then run sizecheck")}`); process.exit(0);
}
let budgets, src;
try {
  if (o.compression && !["gzip", "brotli", "none"].includes(o.compression)) throw new Error(`Unknown compression "${o.compression}" (gzip | brotli | none)`);
  if (a.positionals.length) { budgets = [{ name: a.positionals.join(", "), path: a.positionals, limit: o.limit ? S.parseSize(o.limit) : null, compression: o.compression || "gzip", each: !o.total }]; src = "args"; }
  else { const cfg = S.loadConfig(root); if (!cfg) { console.error(`${c.yellow("⚠ No budgets found.")} Run ${c.cyan("sizecheck --init")} or pass patterns: ${c.cyan('sizecheck "dist/**/*.js" -l 50kB')}`); process.exit(2); } budgets = cfg.budgets; if (o.compression) budgets.forEach((b) => (b.compression = o.compression)); src = cfg.file; }
} catch (e) { console.error(c.red(`✖ ${e.message}`)); process.exit(2); }

const baseFile = path.join(root, ".sizecheck-baseline.json");
const baseline = fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile, "utf8")) : {};
const res = S.check(root, budgets, baseline);
const failed = res.filter((r) => !r.pass);
if (o.save) fs.writeFileSync(baseFile, JSON.stringify(Object.fromEntries(res.map((r) => [r.name, r.size])), null, 2) + "\n");
if (o.json) { console.log(JSON.stringify({ pass: !failed.length, results: res }, null, 2)); process.exit(failed.length ? 1 : 0); }

console.log(header("sizecheck", `${plural(res.length, "budget")} from ${src}`) + "\n");
const barW = 14;
const rows = res.map((r) => {
  const pct = r.limit ? r.size / r.limit : null;
  const fill = pct == null ? "" : Math.min(barW, Math.round(pct * barW));
  const col = r.missing ? c.yellow : !r.pass ? c.red : pct > 0.9 ? c.yellow : c.green;
  const bar = pct == null ? c.dim("no limit") : col("█".repeat(fill)) + c.dim("░".repeat(barW - fill)) + " " + col(Math.round(pct * 100) + "%");
  const delta = r.delta == null || r.delta === 0 ? "" : r.delta > 0 ? c.red(`+${S.fmt(r.delta)}`) : c.green(`−${S.fmt(-r.delta)}`);
  return [r.missing ? c.yellow("?") : r.pass ? c.green("✔") : c.red("✖"), r.name + (r.files.length > 1 ? c.dim(` (${r.files.length})`) : ""), c.dim(S.fmt(r.raw)), (r.compression === "gzip" ? c.bold : c.dim)(S.fmt(r.gzip)), (r.compression === "brotli" ? c.bold : c.dim)(S.fmt(r.brotli)), r.limit ? S.fmt(r.limit) : c.dim("–"), bar, delta];
});
console.log(table(rows, { head: ["", "budget", "raw", "gzip", "brotli", "limit", "", baseline && Object.keys(baseline).length ? "Δ" : ""], align: ["", "", "right", "right", "right", "right", "", "right"] }));
for (const r of res.filter((r) => r.missing)) console.log(`\n${c.yellow("⚠")} ${r.name}: no files matched`);
const over = failed.filter((r) => !r.missing);
if (over.length) { console.log(""); for (const r of over) console.log(`${c.red("✖")} ${c.bold(r.name)} is ${c.red(S.fmt(r.size - r.limit))} over its ${S.fmt(r.limit)} ${r.compression === "none" ? "raw" : r.compression} budget`); }
console.log(`\n${failed.length ? c.red(c.bold(`${plural(failed.length, "budget")} failed`)) : c.green(c.bold("All budgets pass"))}${o.save ? c.dim("  · baseline saved") : ""}`);
process.exit(failed.length ? 1 : 0);
