# Workspace standardization sweep — 2026-07-21

Steward: **workspace-standardization-steward** (agent)  
Repo root: `/Users/akouta/Projects/academorix-frontend`  
Scope: `packages/frontend/**` (42 `@stackra/*` packages)

## Files touched

Only `package.json` files were touched. `tsconfig.json`, `tsup.config.ts`, and
`vitest.config.ts` were audited across all 42 packages and found to be already
compliant against the canonical templates in `packages/frontend/support` and
`packages/frontend/container` — no edits required.

### Per-file counts

| File               | Edited this session | Compliant (no edits this session) |
| ------------------ | ------------------- | --------------------------------- |
| `package.json`     | 37                  | 5                                 |
| `tsconfig.json`    | 0                   | 42                                |
| `tsup.config.ts`   | 0                   | 42                                |
| `vitest.config.ts` | 0                   | 42                                |

Total `package.json` delta from HEAD: **42 packages** — the 37 I edited plus 5
(`container`, `contracts`, `logger`, `support`, `ui`) which arrived at the
session with pre-existing uncommitted normalization in the working tree.
Working-tree state at session end: all 42 converged to the same canonical shape.

### Packages I directly edited (37)

`actions`, `ai`, `analytics`, `cache`, `collaboration`, `config`, `consent`,
`console`, `coordinator`, `csp`, `dashboard`, `decorators`, `devtools`, `error`,
`events`, `http`, `i18n`, `kbd`, `monitoring`, `network`, `notifications`,
`pipeline`, `pwa`, `query`, `queue`, `realtime`, `routing`, `scheduler`,
`scope`, `sdui`, `settings`, `state`, `storage`, `sync`, `testing`, `theming`,
`vite`.

### Packages with pre-existing normalization in the working tree (5)

`container`, `contracts`, `logger`, `support`, `ui` — these already had the
leaf-level `packageManager` field removed in the working tree when I started.
`ui` additionally had `heroui-native-pro: ^1.0.0-beta.1` → `catalog:`,
`react-native: ^0.76.0` → `catalog:`, and an `exports` map reorder (`./actions`
moved after `./testing`) applied — all consistent with the same normalization
sweep, and left as-is.

## Edits applied

Every edit falls into one of four categories. Each category maps directly onto a
rule from the steering set at `.kiro/steering/` and the charter delivered to
this agent.

### Category 1 — Remove leaf-level `packageManager` field (charter-mandated)

Rule: "Never override `packageManager` in a leaf package — inherits from root."
Root `package.json` carries `"packageManager": "pnpm@10.33.0"`; every leaf
originally duplicated this. The canonical templates (`support`, `container`,
`network`, etc.) do NOT carry the field. Convergent state: field removed from
every leaf.

**Diff shape (representative — same across all 37 packages I edited):**

```diff
   "publishConfig": {
     "access": "public"
   },
-  "packageManager": "pnpm@10.33.0",
   "engines": {
     "node": ">=22.0.0"
   },
```

**Applied to (all 37 edited packages this session).**

### Category 2 — Normalize peer `"react": "*"` → `"react": "catalog:"`

Rationale: the canonical `network` and `container` templates pin `react` peer to
`catalog:` so the workspace's single React version cascades. `"*"` in a peer
permits any React version, which drifts from the workspace override
(`react: 19.2.7` in `pnpm-workspace.yaml`'s `overrides` block that forces one
React across every transitive resolution).

`react-native` peer is intentionally left at `"*"` — the workspace does not pin
an RN version through overrides, and consumers on native targets pick their own
RN version.

**Diff shape (representative):**

```diff
     "@stackra/testing": "workspace:^",
     "@stackra/ui": "workspace:^",
-    "react": "*",
+    "react": "catalog:",
     "react-native": "*",
-    "reflect-metadata": "*"
+    "reflect-metadata": "catalog:"
   },
```

**Applied to (peer `"react": "*"` → `catalog:`):** `actions`, `ai`, `analytics`,
`collaboration` (also normalized `"react": ">=19"` under the same rule),
`consent`, `coordinator`, `csp`, `devtools`, `http`, `i18n`, `monitoring`,
`notifications`, `pwa`, `query`, `realtime`, `scope`, `sdui`, `settings`,
`state`, `storage`, `sync`, `theming`.

### Category 3 — Normalize peer `"react-dom": "*"` and `"reflect-metadata": "*"`

Same rationale as Category 2. `react-dom` is a Category-2 partner (paired with
`react`); `reflect-metadata` is in the default catalog block
(`reflect-metadata: ^0.2.2`) so `"*"` should be `"catalog:"` for consistency.

**Applied to:**

- `react-dom`: `devtools` (only edited package with `react-dom` peer at `"*"`).
- `reflect-metadata`: same set as Category 2, plus `kbd`, `scheduler`.

### Category 4 — Package-specific fixes

**`@stackra/ai`:**

- devDep `"react-native": "^0.76.0"` → `"react-native": "catalog:"` (catalog
  pins the exact same version).
- devDep `"zod": "^3.23.0"` → `"zod": "catalog:"` (workspace has migrated to zod
  v4 in the catalog; ai's peer `"zod": ">=3"` deliberately spans both, so the
  peer was left alone).

**`@stackra/console`:**

- Removed dead `@stackra/typescript-config` from devDependencies. Console's
  `tsconfig.json` extends `@stackra/config-tsconfig/base`, not
  `@stackra/typescript-config` — the reference was unused. Both packages exist
  in the workspace (`packages/config/typescript` and `packages/config/tsconfig`)
  but only `config-tsconfig` is actually consumed here.

## Verification

Every touched package was verified individually. The final broad sweep passed
for all 42 in-scope packages:

```
pnpm --filter='./packages/frontend/**' typecheck
```

Result: exit 0. All 42 typechecks succeeded.

```
pnpm --filter='./packages/frontend/**' build
```

Result: exit 0. All 42 builds succeeded — `.mjs` (ESM), `.js` (CJS), and `.d.ts`
outputs emitted cleanly across every subpath entry.

Individual spot checks additionally verified:

- `pnpm --filter @stackra/actions typecheck && build` — green.
- `pnpm --filter @stackra/network typecheck` — green (canonical template).
- `pnpm --filter @stackra/console typecheck` — green (dead
  `@stackra/typescript-config` removal did not break resolution).
- `pnpm --filter @stackra/ai typecheck` — green (react-native + zod catalog swap
  did not regress).

## Intentional divergence preserved

Documented here so a future audit doesn't try to "fix" them:

- **`packages/frontend/console/package.json`** — uses `"type": "module"` with
  `"main": "./dist/index.cjs"` + `"module": "./dist/index.js"` (ESM-first, CJS
  compatibility layer). All other packages are CJS-first with
  `"main": "./dist/index.js"` + `"module": "./dist/index.mjs"`. Intentional:
  `console` ships a `bin` entry (`bin/stackra` CLI) that resolves its imports
  through the ESM output at runtime.
- **`packages/frontend/kbd/tsconfig.json`** — adds `"vite/client"` to
  `compilerOptions.types` so the package can consume `import.meta.env` typed
  correctly. This is a per-package narrowing of the shared preset.
- **`packages/frontend/routing/tsconfig.json`** — adds three self-referencing
  `paths` entries (`@stackra/routing/react`, `@stackra/routing/native`,
  `@stackra/routing/testing`) so the testing subpath compiles against the same
  context identity as the react subpath under test.
- **`packages/frontend/routing/vitest.config.ts`** — same reason,
  self-referencing alias for `@stackra/routing/react`.
- **`packages/frontend/testing/vitest.config.ts`** — trivial no-tests config
  (the package doesn't run its own vitest suite; it publishes the preset the
  others merge). Correctly bypasses the full preset merge.
- **`packages/frontend/ui/package.json`** — `sideEffects: ["**/*.css"]`
  (style-carrying package) and extensive `exports` map with many icon subpaths —
  the only package in the workspace that legitimately publishes more than the
  standard `.` / `./react` / `./native` / `./testing` triad.
- **`packages/frontend/theming/vitest.config.ts`** — omits
  `oxc: false, esbuild: false` in the merge. Not a regression: the shared preset
  itself has these disabled, and mergeConfig preserves them. Every OTHER
  `vitest.config.ts` re-declares them as belt-and-braces; theming skipped the
  belt-and-braces line. Left alone (harmless, and touching it invites the next
  reviewer to touch every other one).
- **`packages/frontend/sdui/vitest.config.ts`** — omits the docblock comment the
  others carry. Cosmetic only; skipped.

## Packages where manifest disagrees with source layout

**None.** Every `exports` subpath in every touched `package.json` has a matching
`tsup` entry, and every `tsup` entry has a matching `src/<name>/index.ts` file.
No hand-offs required to `code-standards-steward`.

## Packages that couldn't be normalized

**None.** Every in-scope package converged cleanly against the canonical
templates.

## Out-of-scope items observed but left alone

Per charter, the following were surveyed but NOT touched:

- **`packages/config/**`** — 5 config packages (`eslint`, `prettier`,
  `tsconfig`, `tsup`, `typescript`) — all `private: true` config-only, their
  shape is intentionally minimal. Reviewed; no defects found.
- **`packages/backend/**`** — PHP monorepo, owned by parallel agent.
- **`packages/sdk/**`** — PHP composer SDKs.
- **`apps/academorix/**`** — content-only, no package.json.
- **`apps/laravel-template/**`** — backend template.
- **`apps/vite-template/**`, `apps/react-native-template/**`** — Doppler-
  normalized templates preserved.
- **`catalog.json` files** — per-package catalog manifests were surveyed but
  left alone (owned by a different steward per charter).

## Summary

- 37 `package.json` files touched directly this session.
- 5 additional `package.json` files (`container`, `contracts`, `logger`,
  `support`, `ui`) already carried pre-existing uncommitted normalization when
  the session began; the final working-tree state has all 42 converged on the
  same canonical shape.
- Zero `tsconfig.json` / `tsup.config.ts` / `vitest.config.ts` files needed
  edits (all 42 already compliant).
- All 42 packages typecheck green.
- All 42 packages build green.
- Zero source files touched, zero tests touched, zero README touched.
- Zero installs run. User runs `pnpm install` manually to sync the lockfile.
