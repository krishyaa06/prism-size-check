<!-- ═════════════ HEADER ═════════════ -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:07060f,50:FFC94D,100:FF7AC6&height=200&section=header&text=Prism%20Size%20Check&fontSize=48&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=Bundle%20size%20budgets%20for%20CI&descAlignY=58&descSize=16" width="100%" alt="Prism Size Check" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=19&duration=2600&pause=800&color=FFC94D&center=true&vCenter=true&width=680&lines=sizecheck;Ship+less+JavaScript;gzip+%2B+brotli+sizes;Fail+CI+on+bloat" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://github.com/krishyaa06/prism-size-check/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/krishyaa06/prism-size-check/ci.yml?branch=main&style=for-the-badge&label=CI&logo=githubactions&logoColor=white" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518.17-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/dependencies-0-FFC94D?style=for-the-badge" alt="Zero dependencies" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/krishyaa06/prism-size-check?style=for-the-badge&color=FF7AC6" alt="License" /></a>
</p>

<p align="center">
  <img src="assets/screenshots/demo.png" width="90%" alt="Prism Size Check screenshot" />
</p>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png" width="100%" alt="" />

## ⚡ Overview

**Prism Size Check** (`sizecheck`) keeps your app fast by giving every bundle a budget. Describe budgets in `.sizecheckrc.json` (or `package.json` → `"sizecheck"`), run it after your build and get a table of raw, gzip and brotli sizes with a progress bar against each limit. It exits with code 1 when something is over budget, so a bloated dependency fails CI instead of slowing down your users.

## ✨ Features

- **Raw, gzip (level 9) and brotli (q11)** sizes for every budget
- **Globs** with `**`, `{a,b}` braces and `!excludes`; directories expand automatically
- **Grouped or per-file** budgets (`"each": true`), choose the compression that counts
- **Baselines**: `--save` stores sizes, later runs show `+/−` deltas
- **Ad-hoc mode**: `sizecheck "dist/**/*.js" -l 50kB` without any config
- `--init` starter config, `--json` output, exit code 1 on failure; zero dependencies

## 🚀 Quick Start

```bash
# run without installing
npx github:krishyaa06/prism-size-check --help

# or install globally
npm install -g github:krishyaa06/prism-size-check
sizecheck "dist/**/*.js" -l 50kB
```

Requires Node.js 18.17+. No dependencies.

## 🛠️ Usage

```text
sizecheck                          check budgets from .sizecheckrc.json / package.json "sizecheck"
sizecheck "dist/**/*.js" -l 50kB   ad-hoc check (each file)
sizecheck --init                   write a starter .sizecheckrc.json

  -l, --limit <size>     budget for ad-hoc patterns (10kB, 1.5MB, 200KiB)
  -c, --compression <c>  gzip (default) | brotli | none
      --total            ad-hoc: sum files instead of checking each
      --save             store current sizes as baseline
      --json             machine-readable output
```

### Config

```json
[
  { "name": "App JS", "path": ["dist/assets/*.js", "!dist/assets/vendor.js"], "limit": "75 kB" },
  { "name": "Vendor", "path": "dist/assets/vendor.js", "limit": "120 kB", "compression": "brotli" },
  { "path": "dist/assets/*.{webp,png,jpg}", "limit": "150 kB", "compression": "none", "each": true }
]
```

### In CI

```yaml
- run: npm run build
- run: npx github:krishyaa06/prism-size-check
```

## 📁 Project Structure

```text
prism-size-check/
├── assets/
│   ├── logo.png
│   └── logo.svg
├── bin/
│   └── sizecheck.js   # CLI entry
├── examples/
│   ├── app/
│   │   ├── dist/
│   │   │   ├── assets/
│   │   │   │   ├── chat.js
│   │   │   │   ├── hero.webp
│   │   │   │   ├── index.js   # globs, gzip/brotli, budgets
│   │   │   │   ├── style.css
│   │   │   │   └── vendor.js
│   │   │   └── index.html
│   │   ├── .gitignore
│   │   └── .sizecheckrc.json
│   └── make-dist.js   # fake build output for the demo
├── src/
│   ├── index.js   # globs, gzip/brotli, budgets
│   ├── ui.js   # colours, tables
│   └── walk.js
├── test/
│   └── sizecheck.test.js
├── .gitignore
├── LICENSE
└── package.json
```

## 🧪 Tests

```bash
npm test
```

Tests use the built-in `node:test` runner, so there is nothing to install. CI runs them on Node 20 and 22.

## 🤝 Contributing

1. Fork the repo and create a branch: `git checkout -b feature/my-idea`
2. Make your change and add a test in `test/`
3. Run `npm test` and open a Pull Request

## 🔷 Part of Prism Protocol

Prism Size Check is one of the open-source tools built by [Prism Protocol](https://dc.gg/prismprotocol), a tech community where young builders learn, ship and compete together.

## 👤 Author

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/krishyaa06"><img src="https://github.com/krishyaa06.png" width="90" style="border-radius:50%" alt="Soumya Bhandare" /><br><b>Soumya Bhandare</b></a><br>
      <sub>Founder @ Prism Protocol</sub>
    </td>
    <td>
      <a href="https://dc.gg/prismprotocol"><img src="https://img.shields.io/badge/Discord-Prism%20Protocol-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a><br>
      <a href="https://instagram.com/prism_protocol_"><img src="https://img.shields.io/badge/Instagram-@prism__protocol__-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" /></a><br>
      <a href="https://x.com/krishyaa06"><img src="https://img.shields.io/badge/X-@krishyaa06-000000?style=for-the-badge&logo=x&logoColor=white" alt="X" /></a>
    </td>
  </tr>
</table>

## 📄 License

Released under the [MIT License](LICENSE).

<p align="center">
  <b>If you like this project, consider giving it a ⭐</b><br>
  <sub>"Build. Create. Compete." · Made with ⚡ by Prism Protocol</sub>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:FF7AC6,50:FFC94D,100:07060f&height=110&section=footer" width="100%" alt="" />
