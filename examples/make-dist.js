// Generates a fake build output in examples/app/dist (deterministic): node examples/make-dist.js
const fs = require("node:fs"), path = require("node:path");
const dist = path.join(__dirname, "app/dist"); fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const words = ["const", "function", "return", "render", "state", "props", "useEffect", "component", "export", "import", "await", "fetch", "prism", "token", "stream", "theme"];
const js = (n) => Array.from({ length: n }, (_, i) => `${words[i % 16]} ${words[(rnd() * 16) | 0]}_${(rnd() * 1e6) | 0}=${(rnd() * 1e9) | 0};`).join("\n");
fs.writeFileSync(path.join(dist, "assets/index.js"), js(5200));
fs.writeFileSync(path.join(dist, "assets/vendor.js"), js(9800));
fs.writeFileSync(path.join(dist, "assets/chat.js"), js(900));
fs.writeFileSync(path.join(dist, "assets/style.css"), Array.from({ length: 700 }, (_, i) => `.c${i}{color:#${((rnd() * 0xffffff) | 0).toString(16).padStart(6, "0")};margin:${i % 9}px}`).join("\n"));
fs.writeFileSync(path.join(dist, "assets/hero.webp"), Buffer.from(Array.from({ length: 182000 }, () => (rnd() * 256) | 0)));
fs.writeFileSync(path.join(dist, "index.html"), "<!doctype html><title>Prism AI</title><div id=root></div><script type=module src=/assets/index.js></script>");
