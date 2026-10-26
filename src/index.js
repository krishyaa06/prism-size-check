"use strict";
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { globToRe } = require("./walk");

const UNITS = { b: 1, kb: 1000, mb: 1e6, gb: 1e9, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3 };
/** "10 kB" → 10000, "1.5MiB" → 1572864, 500 → 500 */
function parseSize(s) {
  if (typeof s === "number") return s;
  const m = /^\s*([\d.]+)\s*([kmg]?i?b)?\s*$/i.exec(String(s));
  if (!m) throw new Error(`Invalid size "${s}" (try 10kB, 1.5MB, 200KiB)`);
  return Math.round(+m[1] * UNITS[(m[2] || "b").toLowerCase()]);
}
const fmt = (n) => (n == null ? "–" : n < 1000 ? `${n} B` : n < 1e6 ? `${(n / 1000).toFixed(2)} kB` : `${(n / 1e6).toFixed(2)} MB`);

const SKIP = new Set([".git", "node_modules"]);
function expand(root, pattern) {
  const neg = pattern.startsWith("!"); if (neg) pattern = pattern.slice(1);
  pattern = pattern.replace(/^\.\//, "");
  if (!/[*?{]/.test(pattern)) { const abs = path.resolve(root, pattern); try { const st = fs.statSync(abs); if (st.isFile()) return [path.relative(root, abs).split(path.sep).join("/")]; if (st.isDirectory()) pattern = pattern.replace(/\/$/, "") + "/**"; } catch { return []; } }
  const alts = braces(pattern).map((p) => new RegExp("^" + globToRe(p) + "$"));
  const base = pattern.split("/").filter((s) => !/[*?{]/.test(s)); base.length = pattern.split("/").findIndex((s) => /[*?{]/.test(s));
  const start = path.join(root, ...base); const out = [];
  (function rec(dir) { let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; } for (const e of ents.sort((a, b) => a.name.localeCompare(b.name))) { if (SKIP.has(e.name)) continue; const abs = path.join(dir, e.name); if (e.isDirectory()) rec(abs); else if (e.isFile()) { const rel = path.relative(root, abs).split(path.sep).join("/"); if (alts.some((r) => r.test(rel))) out.push(rel); } } })(start);
  return out;
}
function braces(p) { const m = /\{([^{}]*)\}/.exec(p); return m ? m[1].split(",").flatMap((x) => braces(p.slice(0, m.index) + x + p.slice(m.index + m[0].length))) : [p]; }
function resolve(root, patterns) {
  const inc = new Set(), exc = new Set();
  for (const p of [].concat(patterns)) { const set = p.startsWith("!") ? exc : inc; for (const f of expand(root, p)) set.add(f); }
  return [...inc].filter((f) => !exc.has(f));
}

function measure(buf) { return { raw: buf.length, gzip: zlib.gzipSync(buf, { level: 9 }).length, brotli: zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } }).length }; }

/** Load budgets from .sizecheckrc.json or package.json "sizecheck". */
function loadConfig(root) {
  const rc = path.join(root, ".sizecheckrc.json");
  if (fs.existsSync(rc)) return { file: ".sizecheckrc.json", budgets: norm(JSON.parse(fs.readFileSync(rc, "utf8"))) };
  const pj = path.join(root, "package.json");
  if (fs.existsSync(pj)) { const d = JSON.parse(fs.readFileSync(pj, "utf8")); if (d.sizecheck) return { file: "package.json", budgets: norm(d.sizecheck) }; }
  return null;
}
const norm = (x) => (Array.isArray(x) ? x : x.budgets || []).map((b) => ({ name: b.name || [].concat(b.path).join(", "), path: b.path, limit: b.limit != null ? parseSize(b.limit) : null, compression: b.compression || "gzip", each: !!b.each }));

/** Run budgets → results [{name, files, size(compressed), raw, gzip, brotli, limit, pass}] */
function check(root, budgets, baseline = {}) {
  const res = [];
  for (const b of budgets) {
    const files = resolve(root, b.path);
    const groups = b.each ? files.map((f) => ({ name: f, files: [f] })) : [{ name: b.name, files }];
    for (const g of groups) {
      const m = { raw: 0, gzip: 0, brotli: 0 };
      for (const f of g.files) { const x = measure(fs.readFileSync(path.join(root, f))); m.raw += x.raw; m.gzip += x.gzip; m.brotli += x.brotli; }
      const size = b.compression === "none" ? m.raw : m[b.compression];
      if (size == null) throw new Error(`Unknown compression "${b.compression}" (gzip | brotli | none)`);
      const prev = baseline[g.name];
      res.push({ name: g.name, files: g.files, ...m, compression: b.compression, size, limit: b.limit, pass: !g.files.length ? false : b.limit == null || size <= b.limit, missing: !g.files.length, delta: prev != null ? size - prev : null });
    }
  }
  return res;
}
module.exports = { parseSize, fmt, expand, resolve, measure, loadConfig, check, braces };
