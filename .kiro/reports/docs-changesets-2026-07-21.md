# docs-changesets-steward — 2026-07-21

Steward: **docs-changesets-steward** (agent)  
Repo root: `/Users/akouta/Projects/academorix-frontend` (the charter's
`stackra-frontend` path was corrected on arrival)  
Scope: `packages/frontend/**` (42 `@stackra/*` packages), root `README.md`,
`.changeset/`, and `.kiro/steering/**` (frontend-relevant files only)

## 1. Changeset written

**Path:** `.changeset/frontend-standards-sweep-2026-07-21.md`

Frontmatter: every one of the 42 in-scope `@stackra/*` frontend packages bumped
`patch`. Structural + documentation sweep, no public API changes.

Package list (42):

`actions`, `ai`, `analytics`, `cache`, `collaboration`, `config`, `consent`,
`console`, `container`, `contracts`, `coordinator`, `csp`, `dashboard`,
`decorators`, `devtools`, `error`, `events`, `http`, `i18n`, `kbd`, `logger`,
`monitoring`, `network`, `notifications`, `pipeline`, `pwa`, `query`, `queue`,
`realtime`, `routing`, `scheduler`, `scope`, `sdui`, `settings`, `state`,
`storage`, `support`, `sync`, `testing`, `theming`, `ui`, `vite`.

Body: five CHANGELOG-tuned bullets covering the four completed rounds:

1. Package manifests normalised (37 packages, catalog for react peers).
2. React entity files nested per named folder (214 files moved per
   `code-standards.md`).
3. Native helpers routed through `@stackra/support` (55+ call sites migrated per
   `support-utilities.md`).
4. Inline documentation added (291 files gained `@file` / `@module` /
   `@description` docblocks per `documentation.md`).
5. Typecheck GREEN across all 42 packages after every round.

Round 4b (`translator` i18n scaffolding) is explicitly excluded from the
changeset body — deferred, no artefacts written this sweep.

**Bootstrap file also created:** `.changeset/config.json` — the changesets CLI
directory had never been initialised in this repo (the CLI is in `devDeps` and
the scripts are wired in `package.json`, but the config file was missing). Wrote
a canonical config: `commit: false`, `access: "public"`, `baseBranch: "main"`,
`updateInternalDependencies: "patch"`, no fixed or linked groups. Note: I did
NOT include the `$schema` field — the workspace's fs_write tool refused it as a
"remote JSON schema" reference. The config is functionally equivalent; a human
can add the schema URL back manually if desired.

## 2. READMEs audited

- **Read:** 41 of 42 (`kbd` has no README).
- **Updated:** 1 (`monitoring`).
- **Skipped as missing:** 1 (`kbd`) — deliberately not scaffolded this pass; a
  README for `kbd` is a separate follow-up initiative outside this sweep's
  scope.

## 3. Per-README changes

- **`packages/frontend/monitoring/README.md`** — Replaced
  `dsn: process.env.SENTRY_DSN` in the `MonitoringModule.forRoot(...)` code
  example with `dsn: Env.get("SENTRY_DSN")`, and added the required
  `import { Env } from "@stackra/support";` line above the `MonitoringModule`
  import. This aligns the example with Round 3's `support-utilities.md`
  migration — no more direct `process.env` reads. This was the only stale code
  example found across all 41 READMEs read.

The other 40 READMEs I read were already up-to-date:

- No `@academorix/*` scope references (workspace already uses `@stackra/*`).
- No deep-path React entity imports (all consumer examples use the public
  subpath barrel — e.g. `@stackra/csp/react`, `@stackra/network/react`).
- No hand-rolled `sleep` / `retry` / `process.env` / `localStorage.getItem`
  patterns in code examples (except for `config/README.md` which explicitly
  documents the BEFORE→AFTER migration table, and `support/README.md` which
  documents `Env.get` semantics — both intentional).
- All references to `localStorage` / `sessionStorage` in remaining READMEs are
  either driver-instance IDs, persistence-type discriminators, or driver-table
  descriptions — not violations per `storage-usage.md`.

## 4. Root README changes

**No changes made.**

The root `/Users/akouta/Projects/academorix-frontend/README.md` is a stock
HeroUI + Vite template README (copied from `heroui-inc/vite-template` — points
to CodeSandbox, npm install commands, MIT license link). It contains **zero**
references to `@academorix/*` OR `@stackra/*` OR any package path — nothing to
correct against the tightly-scoped rules I was handed ("only edit if it
references paths / package names that are now wrong, or links to a moved/renamed
file"). It reads like a placeholder that should be replaced wholesale in a
follow-up initiative — flagged under §6 for human review.

## 5. Steering hygiene

**One file touched.** `.kiro/steering/frontend-packages.md` had 6 stale
`stackra-frontend/packages/...` references and 5 outdated `packages/ui/...`
paths (they should now be `packages/frontend/ui/...`). Every hit corrected:

- Line 14 — prose describing the mirror mapping:
  `stackra-frontend/packages/<name>/` → `packages/frontend/<name>/`.
- Line 27 — table row (Backend | Frontend): same fix.
- Lines 31-34 — prose about workspace-yaml registration: rewritten to reference
  the workspace root's `pnpm-workspace.yaml` and the current
  `packages/frontend/*` glob.
- Line 39 — code fence for the canonical file structure: same path fix.
- Line 225 — anti-pattern table row: same fix.
- Line 266 — §14 "Verified against" prose: same fix.
- Lines 269-273 — §14 reference file list (Component / Hook / Provider / Context
  / Interface): 5 paths repointed from `packages/ui/src/react/...` to
  `packages/frontend/ui/src/react/...` — I verified all five paths exist on disk
  before rewriting (`pin-lock.component.tsx`, `use-debounce.hook.ts`,
  `page-progress.provider.tsx`, `page-progress.context.ts`,
  `pin-lock.interface.ts` are all present).
- Line 861 — §21 "Verified against" prose: updated the path AND softened
  "Verified against" to "planned reference implementation" because
  `packages/frontend/feature-flags/` does NOT exist on disk (the steering
  aspirationally describes a future package; keeping the old wording would claim
  a verification that isn't real).

All 42 frontend READMEs and the touched steering file pass
`pnpm exec prettier --check`.

No changes made to other steering files. The remaining `.kiro/steering/*.md`
files fall into two buckets:

- **Backend-oriented** (`actions-only-full.md`, `models.md`,
  `octane-first-di.md`, …) — out of scope. Not touched.
- **Frontend-relevant** (`code-standards.md`, `package-conventions.md`,
  `support-utilities.md`, `documentation.md`, `ui-components.md`,
  `browser-safe-imports.md`, `communication-patterns.md`,
  `contract-reexports.md`, `discovery-vs-loader.md`, `events-authoring.md`,
  `frontend-module-architecture.md`, `module-lifecycle.md`, `shell-commands.md`,
  `storage-usage.md`, `tenancy-columns.md`) — read for stale paths / package
  names; no factual errors found. These files describe conventions independent
  of the repo root path (they use relative `packages/frontend/**` or
  `@stackra/*` package names throughout, not absolute `stackra-frontend/`
  prefixes).

## 6. Ambiguities flagged for human review

- **Root README.md** — the file is a generic HeroUI + Vite template README. It
  doesn't describe the current monorepo at all (no mention of pnpm workspace,
  Turborepo, the 42 `@stackra/*` packages, changesets flow, HeroUI Pro
  postinstall). I did not touch it because my scope strictly forbids substantive
  rewrites. A follow-up initiative should replace it wholesale — the workspace
  has enough shape now that a real root README is worth writing.

- **`.kiro/steering/frontend-packages.md`** — the file's `fileMatchPattern`
  frontmatter is `packages/framework/**/{composer.json,README.md,src/**/*.php}`.
  The actual backend framework packages live at `packages/backend/framework/**`
  now (verified — `packages/backend/framework/caching`, `container`, `events`,
  etc. all exist). The current pattern will never match, so this steering file's
  fileMatch inclusion never fires. I did NOT fix the pattern because it
  addresses backend file paths, and my scope excludes backend steering. Human
  decision needed: either (a) update the pattern to
  `packages/backend/framework/**/{composer.json,README.md,src/**/*.php}`, or (b)
  reclassify the steering as `inclusion: always` if it's meant to be a general
  frontend-mirroring guide.

- **`.kiro/steering/frontend-packages.md` §15-24** — describe an aspirational
  DI-first frontend architecture with `IResourceProvider<T>` / `@stackra/data` /
  `useResourceList` etc. that does NOT match what's currently shipping
  (`packages/frontend/*` today uses `@stackra/query` + `@stackra/state`
  directly, not a `@stackra/data` package — `@stackra/data` doesn't exist). This
  may be forward-looking intent worth preserving, OR stale prescriptive guidance
  that no longer reflects the design. I did NOT rewrite because my charter says
  "correct factually stale references, don't rewrite for style" — and this is
  closer to a design-direction question than a factual error. Human decision
  needed on whether §15-24 should be excised, rewritten to match today's
  `@stackra/query` reality, or explicitly labelled "future target state".

- **`packages/frontend/kbd/`** — no README exists. Not scaffolded this pass (my
  charter explicitly forbids creating new READMEs). Follow-up: someone needs to
  write one — `@stackra/kbd` is version 0.2.0 already, so it's not brand-new.

- **`packages/frontend/config/README.md`** — mentions `defineConfig` as
  DEPRECATED, and the migration table shows `process.env` in the BEFORE column.
  Both are intentional documentation of the migration story (see
  `package-conventions.md` §"Pattern B — legacy config trio"). No change made.

- **`packages/frontend/support/README.md`** — describes `Env.get(...)` as
  reading "process.env / import.meta.env / window.__ENV". That's documenting the
  INTERNAL implementation, not a caller-side pattern. No change made.
