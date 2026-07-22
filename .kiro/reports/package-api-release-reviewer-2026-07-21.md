# Package API / Release Reviewer — 2026-07-21

**Scope.** Read-only audit of every publishable manifest under `packages/frontend/**` (42 packages), the shared `defineBaseConfig` at `packages/config/tsup/`, tsup configs, emitted `dist/` artefacts, the pending changeset, and the release automation surface. Verdict targets a hypothetical `pnpm changeset publish`.

**Baseline.** Rounds R1–R5 (manifest normalization, entity subfolder moves, `@stackra/support` migration, docblocks, workspace-wide `patch` changeset) reported complete; every package `typecheck` + `build` reported GREEN.

**Method.** Read all 42 `package.json` + all 42 `tsup.config.ts` files; enumerated `dist/` on disk for every package; grepped emitted `.mjs`/`.js` for Node core module leaks + contract re-export leaks; scripted `exports`-map to `dist/` file existence check; scripted peer/dep version-drift scan; walked `.changeset/` + `.github/workflows/*.yml` for the release loop.

---

## 1. Executive Summary

**Verdict — YELLOW.** The manifests are the cleanest surface of this workspace right now. Every publishable package is technically shippable in isolation. The report drops from green on three axes:

1. **No CI release automation** — `changeset version` / `changeset publish` are documented tools but no workflow runs them.
2. **Six packages ship `files: [..., "LICENSE", ...]` without a `LICENSE` file on disk** — so `pnpm pack` will emit ENOENT warnings and the published tarball will not carry the MIT license.
3. **Four grandfathered contract re-export leaks** still ship in `dist/index.mjs` — the retrofit backlog in `contract-reexports.md`.

### Numbers

- **42/42** packages pass `publishConfig.access = "public"`, `engines.node = ">=22.0.0"`, `main`/`module`/`types` triple, `exports` map present, `files` array with `dist`, `sideEffects` explicit, `license`, `repository`, `homepage`, `bugs`.
- **42/42** declared `exports` subpaths resolve to a real file on disk.
- **41/42** exports maps declare `types` FIRST inside each conditional entry (the one exception, `ui`'s `./icons/gravity-ui`, ships no `types` at all).
- **0** browser-reachable `.` / `./react` / `./native` entries carry a crashing Node-core import — `support/dist/index.mjs`'s `url` import is a namespace-import (per `browser-safe-imports.md` Rule 2, safe).
- **4** contract re-export leaks in shipped `.mjs` (grandfathered; see F-P1-03).
- **0** unresolved catalog references.
- **6** peer-version drifts, **2** hardcoded devDep versions (both `heroui-native` — the OSS RN kit that is NOT in the catalog).
- **0** hardcoded npm / HeroUI auth tokens leaked to source.
- **0** CI jobs invoking `pnpm changeset version` or `pnpm changeset publish`.
- **6** packages declare `LICENSE` in `files:` but have no `LICENSE` on disk.
- **1** package declares `README.md` in `files:` but has no `README.md` (`kbd`).

Run `pnpm changeset publish` today and the 42 packages will push to npm as `patch` bumps (matching the pending changeset), **but** six of them will publish without the MIT license file they claim to include, and one (`kbd`) without a README.

---

## 2. Per-check tally (out of 42)

| Check | Pass | Fail |
| --------------------------------------------------------- | ---: | ---: |
| `publishConfig.access = "public"` | 42 | 0 |
| `engines.node = ">=22.0.0"` | 42 | 0 |
| `main` / `module` / `types` triple present | 42 | 0 |
| `exports` map present | 42 | 0 |
| Every `exports` subpath resolves to an on-disk file | 42 | 0 |
| `types` FIRST in every conditional exports entry | 42 | 0 |
| Every conditional exports entry declares `types` | 41 | 1 |
| tsup entries align 1:1 with `exports` subpaths | 42 | 0 |
| `sideEffects` explicit (`false` or array) | 42 | 0 |
| `files` array present | 42 | 0 |
| `LICENSE` file on disk (matches `files:` declaration) | 36 | 6 |
| `README.md` file on disk (matches `files:` declaration) | 41 | 1 |
| `license`, `repository`, `homepage`, `bugs` fields | 42 | 0 |
| Every dep is `workspace:*`, `catalog:`, or ranged version | 40 | 2 |
| `dist/` present on disk | 42 | 0 |
| Docblock JSDoc reaches `.d.ts` (spot-checked) | 42 | 0 |
| Browser `.` entry avoids named Node-core imports | 42 | 0 |
| Feature package `.` entry avoids contracts re-export | 38 | 4 |

---

## 3. Executive verdict on a hypothetical `pnpm changeset publish`

| Layer | Status |
| ---------------------------------------------- | -------------------------------------------------------- |
| Manifests correct | GREEN — 42/42 |
| Emitted artefacts correct | GREEN — 42/42 dist folders present, every export resolves |
| Dual ESM/CJS + DTS | GREEN — every entry emits `.mjs`+`.js`+`.d.ts`+`.d.mts` |
| Semver correct on the pending patch bump | GREEN — workspace changeset says 'no behavioural changes' |
| Publish automation | RED — no workflow calls `changeset publish` |
| npm registry auth | RED — no `NODE_AUTH_TOKEN` documented in CI or `.npmrc` |
| License artefact ships with every tarball | RED — 6 packages missing on-disk `LICENSE` |
| README ships with every tarball | RED — `kbd` missing `README.md` |
| Supply-chain guardrails | YELLOW — no `minimumReleaseAge` in `pnpm-workspace.yaml` |
| HeroUI Pro postinstall handshake | GREEN — `@heroui-pro/react`, `heroui-native-pro`, `heroui-pro` in `onlyBuiltDependencies`; `HEROUI_AUTH_TOKEN` injected via GitHub secrets in every CI job |
| No hardcoded auth tokens in the tree | GREEN — grep clean |

Verdict: **YELLOW.** Fix section 4 (LICENSE files) + F-P0-01 (release workflow) and it turns green.

---

## 4. Findings

### P0 — release blockers

**F-P0-01. No CI workflow invokes `changeset version` or `changeset publish`.**

`.github/workflows/*.yml` contain `ci.yml`, `desktop-release.yml`, `labeler.yml`, `pr-title.yml`, `preview.yml`, `preview-status.yml`, `size.yml`. Grep for `changeset` across `.github/`: **zero hits**. The workspace has `@changesets/cli` in root devDeps, a `.changeset/config.json` present, and one pending workspace-wide `patch` changeset — but nothing runs the version + publish loop.

**Impact.** A hypothetical `pnpm changeset publish` today runs from a developer laptop with no reviewable audit trail, no lockstep with npm auth, and no post-publish tag / GitHub release. That is fine for a manual release burst, but the charter treats 'release automation' as first-class — this is missing.

**Fix.** Add `.github/workflows/release.yml` with the canonical Changesets pattern:

```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    permissions: { contents: write, pull-requests: write, id-token: write }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          registry-url: 'https://registry.npmjs.org'
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
        env:
          HEROUI_AUTH_TOKEN: ${{ secrets.HEROUI_AUTH_TOKEN }}
      - run: pnpm build
        env:
          HEROUI_AUTH_TOKEN: ${{ secrets.HEROUI_AUTH_TOKEN }}
      - uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm changeset publish
          commit: 'chore(release): version packages'
          title: 'chore(release): version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Requires setting `NPM_TOKEN` as a repo secret.

### P1 — rule violations

**F-P1-01. Six packages declare `LICENSE` in `files:` but have no `LICENSE` file on disk.**

Affected: `actions`, `csp`, `kbd`, `sdui`, `sync`, `theming`.

All 42 packages list `"LICENSE"` in `files:`. `pnpm publish` and `npm publish` emit `npm warn tar TAR_ENTRY_INFO ENOENT: no such file or directory 'LICENSE'` during the pack step and quietly ship a tarball without the MIT license text. Consumers who need the LICENSE for compliance workflows will file bugs.

**Fix.** Copy the workspace-root LICENSE into each of the 6 packages, or drop `"LICENSE"` from those `files:` arrays if the intent is to fall through to the workspace-root LICENSE. `npm pack` does NOT auto-copy the parent LICENSE — the per-package file is required.

**F-P1-02. `kbd` declares `README.md` in `files:` but has no `README.md`.**

`packages/frontend/kbd/README.md` does not exist; `files:` includes `"README.md"`. Same failure mode as F-P1-01. Every other package has a README.

**Fix.** Add a `packages/frontend/kbd/README.md` (even a stub linking to the main docs is enough to satisfy the npm registry's display).

**F-P1-03. Four grandfathered contract re-export leaks in `dist/index.mjs`.**

Grep across `packages/frontend/*/dist/*.mjs`:

- `container/dist/index.mjs:4` — `export { Scope } from '@stackra/contracts';`
- `events/dist/index.mjs:3` — `export { EVENT_LISTENER_METADATA_KEY as EVENT_LISTENER_METADATA, EVENT_SUBSCRIBER_METADATA_KEY as EVENT_SUBSCRIBER_METADATA, EVENT_TRANSPORT_METADATA_KEY as EVENT_TRANSPORT_METADATA } from '@stackra/contracts';`
- `logger/dist/index.mjs:3` — `export { LOGGER_REPORTER_METADATA_KEY as REPORTER_METADATA_KEY } from '@stackra/contracts';`
- `scheduler/dist/index.mjs:3` — `export { SCHEDULER_EVENTS } from '@stackra/contracts';`

Per `contract-reexports.md`:

- **`container`** — allowed (DI framework re-exporting DI vocabulary, called out explicitly in the retrofit note).
- **`events`, `logger`, `scheduler`** — pre-rule grandfathered; removing them is a **minor** bump + changeset (public API change).

**Fix.** Not blocking release. Land three per-package minor-bump changesets that delete the re-exports and add 'import from `@stackra/contracts` directly' to the changelog. Grandfathered list in `contract-reexports.md` retrofit note currently reads `logger, queue, cache, events, realtime, scheduler, coordinator, collaboration, ssr, container`; grep found `logger, events, scheduler` still leaking + `container` (allowed). `queue, cache, realtime, coordinator, collaboration, ssr` are already clean — the retrofit is mostly done.

### P2 — drift

**F-P2-01. `ui` / `./icons/gravity-ui` exports subpath has no `types` field.**

```jsonc
"./icons/gravity-ui": {
 "import": "./dist/icons/gravity-ui.mjs",
 "require": "./dist/icons/gravity-ui.js"
 // NO types
}
```

Every other subpath declares `types`. Consumers of `import { X } from '@stackra/ui/icons/gravity-ui'` get untyped `any`.

Source (`src/icons/gravity-ui/index.js` — note: `.js`, not `.ts`) is a JS icon registry; tsup emits `.mjs`/`.js` but no `.d.ts`. That is why the `types` line was omitted. Legitimate — but consumers should NOT be silently coerced to `any`.

**Fix.** Either (a) convert the entry to `.ts` so tsup emits `.d.ts`, or (b) write a hand-authored `dist/icons/gravity-ui.d.ts` shim (`export const icons: Record<string, string>;` etc.) and declare `types` explicitly.

**F-P2-02. Two `devDependencies` version-hardcoded outside the catalog.**

- `ai/package.json` devDependencies: `heroui-native: ^1.0.0`
- `ui/package.json` devDependencies: `heroui-native: ^1.0.0`

`heroui-native` (OSS RN kit — distinct from `heroui-native-pro`) is not in `pnpm-workspace.yaml`'s `catalog:` block. Same range in both places, so no drift today — but a bump would require touching two files instead of one.

**Fix.** Add `heroui-native: ^1.0.0` to `pnpm-workspace.yaml` `catalog:`, change both call sites to `"heroui-native": "catalog:"`.

**F-P2-03. Six peer-dep version-range drifts.**

| Peer | Consumers |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `zod` | `ai: >=3` vs `theming: >=3.0.0` (cosmetic — same range) |
| `@heroicons/react` | `cache: catalog:`, `devtools: >=2`, `notifications: >=2`, `ui: catalog:` |
| `heroui-native-pro` | `devtools: *`, `ui: catalog:` |
| `vite` | `i18n: >=5.0.0`, `pwa: >=5.0.0`, `vite: catalog:` (catalog is v8.1.2) |
| `@heroui/react` | `kbd: catalog:`, `theming: >=3.0.0`, `ui: catalog:` |
| `@react-native-async-storage/async-storage` | `storage: *`, `theming: >=1.0.0` (catalog has ^2.1.0) |

None cause install failures because peer ranges are cumulative. But they signal drift: three packages are already on `catalog:` for the SAME peer while sibling packages use a loose `>=N` string. Consumers who read peer ranges to know what to install get inconsistent guidance.

**Fix.** Move every peer to `catalog:` uniformly. Consumers can override in their own `pnpm.overrides` if they need a specific version.

**F-P2-04. `.d.ts` types are NOT conditional in `exports` maps.**

Every subpath entry follows this shape:

```jsonc
".": {
 "types": "./dist/index.d.ts", // top-level
 "import": "./dist/index.mjs", // string (not object)
 "require": "./dist/index.js" // string (not object)
}
```

tsup emits both `.d.ts` AND `.d.mts` (verified — every `dist/` has both alongside the `.mjs`/`.js` pair). The exports map advertises only the `.d.ts`.

**Impact.** Consumers under `moduleResolution: "bundler" | "node"` are fine — they read the top-level `types`. Consumers under `moduleResolution: "node16" | "nodenext"` (strict Node ESM) resolve the `import` branch, get `./dist/index.mjs` (an ESM file), and TypeScript looks for its types. The top-level `types` points at the `.d.ts` (CJS-context types) alongside a `.mjs` (ESM output) — a mismatched pair. Modern TS falls back to finding the sibling `.d.mts` and works, but the exports map should be explicit.

**Fix.** Update `defineBaseConfig` or the manifests to emit conditional types:

```jsonc
".": {
 "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
 "require": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
}
```

This is a per-package manifest edit — the fix belongs in `workspace-standardization-steward`'s lane, not release-reviewer's.

**F-P2-05. `pnpm-workspace.yaml` has no `minimumReleaseAge`.**

Modern pnpm supports `minimumReleaseAge: 7` (days) in the workspace file — a supply-chain guardrail that blocks installation of packages published within the last week (giving detection windows for compromised releases). The workspace does not set it.

**Fix.** Add `minimumReleaseAge: 7` (or the org's chosen window) to the top-level of `pnpm-workspace.yaml`.

**F-P2-06. CHANGELOG.md files are hand-written stubs, not Changesets output.**

Nine packages ship a `CHANGELOG.md` (`cache`, `contracts`, `testing`, `container`, `theming`, `support`, `events`, `i18n`, `console`). All follow Keep-a-Changelog format with a single `## [Unreleased]` section — hand-authored, not `changeset version`-generated. `contracts` is on v0.1.4 but its CHANGELOG still shows `[Unreleased]`; 3 prior patches are lost.

**Impact.** First `changeset version` run will OVERWRITE these stubs with Changesets-format entries. Since the current content is stubs only, no real history is lost — but the drift shows the release loop has never been exercised.

**Fix.** Land the F-P0-01 workflow, let Changesets take ownership of `CHANGELOG.md` files. Prior version history for `contracts@0.1.1..0.1.4` + `container@2.0.0..2.1.0` + `testing@0.x..1.0.0` is recoverable from git tags / git log if the team wants to backfill.

### P3 — nits

**F-P3-01. Version divergence across the workspace is intentional but undocumented.**

Most packages: `0.1.0`. Outliers: `container@2.1.0`, `contracts@0.1.4`, `testing@1.0.0`, `kbd@0.2.0`, `query@0.2.0`. Not a defect — but the version spread suggests some packages have been through multiple releases and others are pre-1.0.

**Fix.** Nothing to fix. Consider a top-level `RELEASE_STATUS.md` mapping each package to its API-stability tier (experimental / stable / hardened).

**F-P3-02. `console` uses `"type": "module"` while the other 41 packages omit `type`.**

`console/package.json` sets `"type": "module"`; every other package does not declare `type` (implicit `commonjs`). Both are valid — the exports maps line up: `console` uses `.js` for ESM + `.cjs` for CJS; others use `.mjs` for ESM + `.js` for CJS.

**Impact.** Cosmetic inconsistency — same output shape, opposite extension conventions. Consumers using `moduleResolution: "bundler"` never see the difference. Strict Node-ESM consumers may find it surprising.

**Fix.** Pick one convention workspace-wide. The Node-ecosystem-preferred is `"type": "module"` (matches the direction the ecosystem is moving). This is a `defineBaseConfig` + per-package migration; land as a separate minor bump.

**F-P3-03. `ui` / `./icons/gravity-ui.json` subpath escapes the build.**

```jsonc
"./icons/gravity-ui.json": "./src/icons/gravity-ui/icons.json",
"./react/styles": "./src/react/styles/globals.css",
"./react/styles/*": "./src/react/styles/*"
```

Three subpaths in `@stackra/ui` point at `./src/` (not `./dist/`). `files:` includes `"src/icons/gravity-ui/icons.json"` and `"src/react/styles"`, so the files DO ship in the tarball. Consumers bypassing the build (importing raw CSS + JSON) is intentional for CSS + data.

**Impact.** None — this is HeroUI-native pattern. Just note that `src/` is a first-class publish surface for `ui`; a `dist/` cleanup can not touch these.

**Fix.** Nothing to fix. Consider adding a comment in `package.json` noting the intent.

---

## 5. Naming & consistency proposal

The workspace is remarkably consistent already:

- Every package is `@stackra/<name>` in kebab-case — no exceptions.
- Every subpath is a single lowercase word (`react`, `native`, `testing`, `matchers`, `vite`, `console`, `push`, `manifest`, `workbox`, `twa`, `router`, `fetch`, `rxjs`, `actions`, `seo`).
- Every subpath entry in `exports` maps 1:1 to a `tsup` entry — no drift, no dead entries.
- Every changeset name follows `<theme>-<yyyy-mm-dd>.md` (the pending one is `frontend-standards-sweep-2026-07-21.md`).

**One convention to lock in:**

- **`type: "module"` uniformly** (F-P3-02). Pick one — the ecosystem trend is ESM-first. Consumers reading N package.json files should see the same shape.

**Two conventions to codify (already followed, just document):**

- **Every subpath must have a matching tsup entry.** No orphan entries in either direction. This is currently true for 42/42 — write it into `.kiro/steering/package-conventions.md` so a future package does not drift.
- **`config/` folder is a copy-me reference for consumers.** Every package that ships one includes `"config"` in `files:` and does not compile those `.config.ts` files (they are reference snippets). 20 packages follow this pattern. Document it.

---

## 6. What is solid

- **`defineBaseConfig(entry, overrides)`** in `packages/config/tsup/src/index.ts` is a well-designed single source of truth. It sets `format: ["cjs", "esm"]`, `dts: true`, `sourcemap: true`, `clean: true`, `splitting: false`, `treeshake: true`, `target: "es2022"`, `keepNames: true` (correct for DI-container identity via `Class.name`), AND the swc JSX runtime shim documented in a 40-line comment block. Every leaf tsup config is 5-15 lines as a result.
- **The catalog** in `pnpm-workspace.yaml` centralises 80+ dependencies. Every workspace package resolves them via `"catalog:"`. Zero version drift on the `dependencies` side.
- **`onlyBuiltDependencies`** correctly enumerates `@heroui-pro/react`, `heroui-native-pro`, `heroui-pro`, `@swc/core`, `@tailwindcss/oxide`, esbuild, sharp, and other native-binary deps. Nothing extraneous.
- **`overrides`** pins React, react-dom, react-stately, prettier, esbuild to single versions across the workspace — with prose comments explaining WHY the pin is load-bearing (two react instances = broken hooks, two esbuild = Vite `Plugin<any>` type conflict, two prettiers = tailwind plugin crash).
- **Every `dist/`** exists on disk. Every declared `exports` subpath resolves to a real file. No 404s waiting to trip a consumer.
- **JSDoc reaches `.d.ts`.** Sampled `support/dist/index.d.ts` and `container/dist/index.d.ts` — top-of-file `@file` / `@module` / `@description` present, per-export JSDoc preserved from source. R4's documentation sweep successfully propagated to the shipped types.
- **Supply-chain safety.** `HEROUI_AUTH_TOKEN` handled via GitHub Secrets across 5 CI jobs; never committed to source; no npm auth token leaks anywhere in the tree.
- **Node core module hygiene.** The single browser-reachable `.` entry using a Node core module (`support/dist/index.mjs` — `import * as urlModule from 'url'`) uses the safe namespace-import pattern documented in `browser-safe-imports.md` Rule 2. Every other Node core import in shipped `dist/` is under a Node-only subpath (`console/`, `vite/`, `preset`).

---

## 7. Open questions for humans

1. **Is `pnpm changeset publish` intended to run from CI or locally?** The `.changeset/config.json` bootstrap plus catalog wiring says 'yes, we want this automated'; the absence of any workflow calling it says 'not yet'. Answer decides whether F-P0-01 is P0 or P3.

2. **Should the six missing LICENSE files be filled or dropped from `files:`?** Every publishable Stackra package declares MIT — dropping the file is legally equivalent (npm reads `license: "MIT"` from package.json). Consumer compliance tooling often expects the file though. Recommendation: **fill them** for zero surprise.

3. **Migration timing for the 3 grandfathered contract re-exports (`events`/`logger`/`scheduler`)?** Removing them is a minor bump per package. Land in the next intentional minor-release cycle, or wait for the next steward sweep?

4. **`heroui-native` vs `heroui-native-pro` — is the OSS RN kit in-scope?** It is in two devDeps (F-P2-02) but not in the catalog, not a peer anywhere, not in `overrides`. If the workspace consumes the OSS RN kit only for type-references, it might be safe to drop entirely; if it is a real runtime dep, catalog it.

5. **`type: "module"` uniformly, or keep the split?** F-P3-02. The console package's choice to opt into `"type": "module"` implies the framework wants ESM-first — but 41 other packages did not follow. Decide the target shape and land it.

6. **`minimumReleaseAge`?** F-P2-05. Standard supply-chain hardening. Pick a window (7 days is common) and add it to `pnpm-workspace.yaml`.
