# Backend Platform Reviewer — Ship + Run Audit

**Date:** 2026-07-21 **Reviewer:** backend-platform-reviewer (Phase 5 verify
lane) **Scope:** packages/backend/**, apps/academorix/**,
apps/laravel-template/**, tools/cli/**, .github/workflows/**, top-level configs
**Mode:** READ-ONLY **Workspace root:**
/Users/akouta/Projects/academorix-frontend

## Executive summary

**Overall platform health: AT-RISK.**

The backend has effectively **no ship or run path today**. The workspace is
correctly wired as a TypeScript-first pnpm + Turborepo monorepo, but the
"backend" it advertises is a set of ~90 PHP library packages under
`packages/backend/**` that **no runnable app consumes**. The four documented
runtime pillars — containers, Horizon, Octane, and CI-side PHP tooling — are all
absent from the tree:

- **No `docker/`** anywhere; no Dockerfile, no `docker-compose.yml`, no entry
  script.
- **No `apps/api`, `apps/ai-service`, or `apps/template`** — the runnable apps
  every steering doc + ADR references. The single Laravel-shaped app that exists
  (`apps/laravel-template`) is the stock Laravel 13 skeleton and declares
  **zero** `stackra/*` composer dependencies.
- **No PHP CI.** All seven workflows are TypeScript-only; there is no
  `composer install`, no `pest`, no `phpstan`, no `pint --test` in any lane.
- **No Horizon config, no Octane config** in any app.

At the same time, the TypeScript CI + governance surface has drifted from a
previous workspace shape: **12+ references to `apps/dashboard/**` survive**
across CI, CODEOWNERS, labeler, preview status, size limit, and the desktop
release workflow — but `apps/dashboard/` does not exist. The Playwright test
directory (`./e2e`) does not exist. `.size-limit.json` is empty (`[]`). The
first `v*` tag will fire a broken `desktop-release.yml` run.

**Top three operational risks:**

1. Every backend package's Turbo shim (`packages/backend/*/package.json`)
   invokes `pint` / `phpstan` from paths under `apps/ai-service/vendor/bin/` or
   `apps/template/vendor/bin/` — neither app exists. Any
   `pnpm turbo run lint --filter=@stackra/foundation` (or equivalent) will fail
   with "file not found" the moment someone actually runs the pipeline.
2. The Laravel-Octane invariant advertised by
   `.kiro/steering/octane-first-di.md` has no verification lane. Every
   `#[Scoped]` / `#[Singleton]` decision across `packages/backend/**` sits on
   top of an assumed runtime that has never been exercised because no app boots
   the packages under Octane.
3. `.github/workflows/desktop-release.yml` fires on `v*` tag push and references
   `apps/dashboard/src-tauri/` that does not exist. The first release tag will
   red-build across four platform matrix legs.

## Findings by concern

### 1. Containers

**Verdict: ENTIRELY ABSENT.**

- `find` for `Dockerfile` excluding `**/vendor/**` returned **zero** matches.
- `find` for `docker-compose*` excluding `**/vendor/**` returned **zero**
  matches.
- There is no `docker/` directory at repo root or under any app.
- `.kiro/steering/architecture.md` (Non-negotiable conventions) advertises
  `docker/` as an existing top-level directory. The tree contradicts that claim.
- `apps/laravel-template/composer.json` `dev` script runs `php artisan serve` —
  the built-in dev server — with no container layer.
- No `entrypoint.sh`, no `nginx.conf`, no PHP-FPM pool config.
- CI runs on GitHub-hosted `ubuntu-latest` / `macos-14` / `windows-2022`
  runners; no container image is built or referenced.

**Findings:**

- **P0 · container-01:** no production packaging path for any backend package or
  app. Every ADR + steering assumption about Docker + Octane + Horizon
  presupposes an image that does not exist.
- **P0 · container-02:** `.kiro/steering/architecture.md` documents a `docker/`
  root that never existed here (or has been removed and the steering has not
  been updated). Either land the tree or update the steering.

### 2. Horizon

**Verdict: LIBRARY PRESENT, NO RUNTIME.**

- `packages/backend/telemetry/horizon/` is a functional composer library that
  wraps `laravel/horizon` with `#[AsMetric]` + `#[HorizonTag]` attributes for
  attribute-driven metric + queue-tag registration.
- **No app in the workspace boots Horizon.** `find` for `**/config/horizon.php`
  (excluding `**/vendor/**`) returned **zero** matches.
- No supervisor definitions.
- No `queue:work` / `horizon:work` in any composer / npm script.
- No failed-job retention config.
- No jobs anywhere declare `#[Tries]` / `#[Backoff]` because there are no jobs
  to declare — the domain layer is a blueprint tree, not runnable code.

**Findings:**

- **P0 · horizon-01:** Horizon adapter package ships but the tree has no app
  that supervises it. Every claim in `.kiro/steering/architecture.md` about
  Horizon as the queue supervisor is aspirational.
- **P1 · horizon-02:** if a supervisor is intended, the failed-job retention and
  queue segmentation policies (per-app queue name, priority, --tries, --backoff)
  need documented defaults before any job class lands.

### 3. Octane runtime

**Verdict: DECLARED INVARIANT, NO VERIFICATION.**

- `.kiro/steering/octane-first-di.md` locks the entire backend to Octane
  targeting ("Roadrunner or Swoole"). ADR-0025 is referenced.
- `packages/backend/foundation/src/Providers/FoundationServiceProvider.php`
  registers a `RequestHandled` listener that clears `CorrelationId::forget()`
  between requests. That listener is correct and is Octane-worker-restart safe
  (bound as a named static method reference, per the steering rule).
- **No app has `config/octane.php`.** Grep for `octane:start` / `OCTANE_SERVER`
  / `swoole` / `roadrunner` across the tree (excluding vendor + steering docs +
  specs) returned **zero** runtime hits.
- `apps/laravel-template/composer.json` `dev` script uses `php artisan serve` —
  the exact runtime that the steering warns "HIDES Octane-specific bugs".
- The Octane-safety guarantees on every `#[Scoped]` / `#[Singleton]` binding
  across `packages/backend/**` sit on top of an unverified runtime target.

**Findings:**

- **P0 · octane-01:** the entire framework's DI story depends on Octane
  correctness. No app boots under Octane. `.kiro/steering/octane-first-di.md`
  (Local dev vs. Octane parity) prescribes a manual Octane smoke test PER PR on
  `#[Singleton]` bindings — unenforceable without a target app.
- **P1 · octane-02:** the `RequestHandled` listener in
  `FoundationServiceProvider` handles the sync path but does NOT bind
  `Laravel\Octane\Events\RequestTerminated` (which the steering names as the
  correct Octane hook). Register the RequestTerminated listener alongside the
  sync one when an Octane target app exists.

### 4. Doppler

**Verdict: WIRE COHERENT, GUARDRAIL SOFT.**

- Root `.doppler.yaml` pins `project: stackra-monorepo` /
  `config: dev_monorepo`.
- Per-app `.doppler.yaml` files pin distinct projects:
- `apps/vite-template/.doppler.yaml` →
  `stackra-vite-template / dev_vite_template`.
- `apps/react-native-template/.doppler.yaml` →
  `stackra-react-native-template / dev_react_native_template`.
- `apps/laravel-template/.doppler.yaml` →
  `stackra-laravel-template / dev_laravel_template`.
- Root `package.json` exposes `doppler:login`, `doppler:setup`, `doppler:me`
  scripts.
- All three template apps wrap their runtime scripts in `doppler run --` per the
  mandatory `--` rule.
- Only 2 composer scripts in the whole workspace wrap in `doppler run --` (both
  inside `apps/laravel-template/composer.json`: `dev`, `test`) — this is correct
  because no other composer script needs runtime secrets (backend packages are
  libraries).
- `.env.example` at `apps/laravel-template/.env.example` documents every env var
  with defaults — good.
- `docs/doppler.md` (referenced by every reviewer charter + steering) **does not
  exist** in `docs/`.
- **On-disk `.env` at `apps/laravel-template/.env` contains an `APP_KEY`
  value.** The file matches `.gitignore` (`.env` is ignored), so it is likely
  untracked, but presence-on-disk means the guardrail depends purely on
  gitignore, not on absence.
- No known secret-prefix hits (sk_live_, AKIA, xoxb-, ghp_) in shipped code
  excluding vendor — only tests + spec examples + a Stripe-key regex pattern in
  a JSON schema.

**Findings:**

- **P0 · doppler-01:** `docs/doppler.md` is referenced by every reviewer's
  operating brief but does not exist. Land it (project layout, config naming,
  per-app project mapping, secret rotation runbook).
- **P1 · doppler-02:** `apps/laravel-template/.env` exists on disk. Confirm it
  is untracked (`git status`), then add a `pre-commit` hook that fails closed if
  a real `.env` is ever staged.
- **P2 · doppler-03:** the CI workflows correctly pass through `DOPPLER_TOKEN`
  via `globalPassThroughEnv` in `turbo.json`, but no CI job actually sets
  `DOPPLER_TOKEN`. If the CI ever needs to run `doppler run --`-wrapped commands
  (queue tests, integration tests), this needs a documented plan.

### 5. Turborepo

**Verdict: TS PIPELINE SOUND, PHP PIPELINE MISSING, BACKEND SHIMS BROKEN.**

- `turbo.json` shape is correct:
- `ui: tui`.
- `globalDependencies` covers tsconfig, eslint, prettier, prettier ignore,
  lockfile, pnpm workspace, npmrc, nvmrc.
- `globalEnv: ["NODE_ENV", "CI"]`.
- `globalPassThroughEnv` covers
  PATH/HOME/NODE_OPTIONS/TERM/COLORTERM/FORCE_COLOR/DOPPLER_TOKEN/TURBO_TOKEN/TURBO_TEAM/HEROUI_AUTH_TOKEN/HEROUI_PERSONAL_TOKEN/CHANGESET_TOKEN/GITHUB_TOKEN/GH_TOKEN.
- Every task declares proper `dependsOn: ["^build"]` + `inputs` + `outputs` —
  cache-correct for the TypeScript surface.
- `build` scans for `VITE_*` / `EXPO_PUBLIC_*` / `NEXT_PUBLIC_*` + HeroUI Pro
  tokens on its `env` — correct.
- **The pipeline is TypeScript-only.** No `analyse` task (PHPStan). No
  `install:composer` task. No `test:php` task. No `lint:php` task. Turbo will
  never exercise the PHP surface.
- **Every `packages/backend/*/package.json` Turbo shim references binaries under
  app paths that DO NOT EXIST:**
- `packages/backend/foundation/package.json`:
  `../../apps/laravel-template/vendor/bin/pint` + `phpstan` — laravel-template
  DOES exist but requires `composer install` to populate `vendor/`;
  laravel-template does require `laravel/pint` in `require-dev`, so the path
  resolves after install.
- `packages/backend/framework/crud/package.json`:
  `../../apps/ai-service/vendor/bin/pint` — **apps/ai-service DOES NOT EXIST**.
- `packages/backend/framework/database/package.json`: same broken path.
- `packages/backend/framework/service-provider/package.json`: same broken path.
- `packages/backend/framework/events/package.json`:
  `../../apps/template/vendor/bin/pint` — **apps/template DOES NOT EXIST**.
- `packages/backend/framework/exceptions/package.json`: same broken path.
- `packages/backend/framework/scheduling/package.json`: same broken path.
- `packages/backend/telemetry/health/package.json`:
  `../../apps/ai-service/vendor/bin/pint` — broken path.
- **Shared PHP configs referenced by every backend package are missing:**
- `packages/backend/foundation/phpstan.neon` includes
  `../../config/phpstan-base.neon` — **DOES NOT EXIST**.
- `packages/backend/compliance/retention/phpstan.neon` includes
  `../../../config/phpstan-base.neon` — **DOES NOT EXIST**.
- Every Turbo shim references `--config ../../config/pint.json` — **DOES NOT
  EXIST**.
- Grep for `phpstan-base.neon` and `pint.json` at any tree location returned
  zero files.
- Remote cache: `TURBO_TOKEN` + `TURBO_TEAM` passed through in every CI job's
  env; if the org has provisioned them, remote cache works.
  `docs/turbo-remote-cache.md` is referenced everywhere but **does not exist**
  in `docs/`.
- No `TURBO_REMOTE_CACHE_SIGNATURE_KEY` referenced anywhere — CI won't sign
  cache artefacts, so a compromised cache token can inject content.

**Findings:**

- **P0 · turbo-01:** 7 backend package `package.json` shims reference `pint` and
  `phpstan` under app paths that do not exist. These scripts will fail with
  "file not found" the moment someone runs them. Repoint at
  `apps/laravel-template/vendor/bin/` OR add the two apps.
- **P0 · turbo-02:** `config/phpstan-base.neon` and `config/pint.json` are
  referenced by every backend `phpstan.neon` + every backend Turbo shim but
  neither file exists. Every backend `analyse` and `lint` script is broken.
- **P0 · turbo-03:** `turbo.json` tasks map does not declare `analyse`,
  `install:composer`, `test:php`, `lint:php`, so even if the shims were fixed,
  Turbo's `pnpm turbo run <task>` invocations for these targets are
  passthrough-only and never cached. Add them to `tasks:` with proper `inputs` +
  `outputs` so the PHP lane is cache-aware.
- **P1 · turbo-04:** `docs/turbo-remote-cache.md` is referenced by 4 reviewer
  charters + 2 steering docs but does not exist. Land it, and document the
  `TURBO_REMOTE_CACHE_SIGNATURE_KEY` policy alongside `TURBO_TOKEN` +
  `TURBO_TEAM`.

### 6. CI workflows

**Verdict: WELL-CRAFTED TS PIPELINE, DRIFT AGAINST CURRENT TREE, ZERO PHP.**

Seven workflows total:

- **`.github/workflows/ci.yml`** — five jobs:
- `quality` (15 min): `pnpm format:check`, `pnpm lint`, `pnpm typecheck`,
  `pnpm knip`, `pnpm knip --production`.
- `test` (20 min): `pnpm test` — Vitest via Turbo.
- `build` (25 min): `pnpm build` — dependency on quality + test. Correct
  ordering.
- `e2e` (30 min): Playwright chromium, depends on `build`. `if:` guard correctly
  skips draft PRs.
- `desktop-build` (25 min, matrix ubuntu-22.04/macos-14/windows-2022): Rust
  cargo check. `working-directory: apps/dashboard/src-tauri` —
  **`apps/dashboard/` does not exist**. Job will fail immediately on any push to
  main OR any PR to a non-fork branch.
- Correct: NODE_OPTIONS 4 GiB heap, concurrency guard, permission-scoped,
  timeout-minutes on every job, pnpm store cache, actions pinned to major,
  HeroUI Pro tokens on every job.
- **`.github/workflows/desktop-release.yml`** — `v*` tag-triggered. Builds Tauri
  bundles for 4 targets. Every step references `apps/dashboard/src-tauri/` and
  `apps/dashboard/DESKTOP_OPS.md` — none exist. **The first `v*` tag will
  red-build across all four matrix legs.**
- **`.github/workflows/labeler.yml` + `.github/labeler.yml`** — v5 labeler
  correctly configured. `area/dashboard` glob (`apps/dashboard/**`) and
  `area/landing-page` glob (`apps/landing-page/**`) match no files because
  neither directory exists.
- **`.github/workflows/pr-title.yml`** — semantic PR title enforcement, types
  allowlist matches `commitlint.config.mjs`. Sound.
- **`.github/workflows/preview-status.yml`** — path-scoped to `apps/**` +
  `packages/**` + workspace root. Diff logic checks for `apps/dashboard` +
  `apps/landing-page` — will never comment because those paths don't exist.
- **`.github/workflows/preview.yml`** — Vercel deployment smoke test. Safe no-op
  unless Vercel is wired to the repo.
- **`.github/workflows/size.yml`** — reads `.size-limit.json` which is `[]`.
  Every PR is a no-op green check. Zero enforcement.
- **`.github/dependabot.yml.disabled`** — the file exists but is disabled by the
  `.disabled` suffix. No automated dependency updates for a stack that pulls a
  licensed private registry (`@heroui-pro/*`) + a fast-moving Refine v5 + a
  v7-recent React Router.

**No PHP job.** Zero workflows exercise composer / pest / phpstan / pint /
larastan. Grep of `.github/**/*.yml` for these tokens returned zero matches.

**Playwright e2e:** `playwright.config.ts` declares `testDir: "./e2e"`. `e2e/`
directory does not exist. `pnpm e2e` runs Playwright which will error "No tests
found" (not the same as `--passWithNoTests`).

**Findings:**

- **P0 · ci-01:** `desktop-build` job in `ci.yml` and every job in
  `desktop-release.yml` references `apps/dashboard/src-tauri/` — path does not
  exist. First tag push will red-build. Fix: either restore the dashboard app or
  gate the desktop workflow behind path existence.
- **P0 · ci-02:** no PHP job anywhere. If `packages/backend/**` is expected to
  compile / lint / test, add a `php.yml` workflow with `setup-php` + a matrix
  over the PHP versions the composer.json's declare (`^8.3`).
- **P1 · ci-03:** `.size-limit.json` is `[]` — the size guardrail is a no-op.
  Populate with real chunk budgets per shipped bundle, or remove the workflow.
- **P1 · ci-04:** Playwright `testDir: "./e2e"` does not exist. Either add the
  directory + smoke tests, or set `--passWithNoTests`, or drop the e2e job until
  a target ships.
- **P1 · ci-05:** `.github/workflows/preview-status.yml` filters on
  `apps/dashboard` + `apps/landing-page` — will never comment. Update or remove.
- **P2 · ci-06:** `dependabot.yml.disabled` — clarify the intent (why disabled?)
  and re-enable with `.yml` suffix, or delete.
- **P2 · ci-07:** actions pinned to `@v4` / `@v5` / `@v1.8.0` — good for most
  but not SHA-pinned. For supply-chain hardening on release-critical workflows
  (`desktop-release.yml` uploads signed artefacts) consider SHA pinning.

### 7. Release automation

**Verdict: SCRIPTS EXIST, WORKFLOW DOES NOT.**

- Root `package.json` declares `changeset`, `changeset:status`,
  `changeset:version`, `changeset:publish` scripts.
- **`.changeset/` directory does not exist** at repo root.
- **No `release.yml`, `release-please.yml`, or `changesets.yml` workflow** in
  `.github/workflows/`. The Changesets flow that `release-manager` +
  `docs-changesets-steward` charters describe has zero live surface.
- Backend `packages/backend/**` (Composer packages) have **no publish path** at
  all — no packagist / Satis / private-registry destination. Every `stackra/*`
  composer package is consumed via workspace-local path repositories only.
- Frontend `packages/frontend/*` declare `publishConfig.access: public` on their
  `package.json` — points at public npm but no publish workflow triggers it.
- `CHANGESET_TOKEN` is listed in `turbo.json`'s `globalPassThroughEnv` but never
  referenced by any workflow secret.
- `desktop-release.yml` uploads GitHub Release artefacts, so a `v*` tag DOES
  produce a release — but only as a draft, and only from an app that does not
  exist.

**Findings:**

- **P0 · release-01:** the Changesets flow is documented in charters but has
  zero live surface. Land `.changeset/config.json`, land a `release.yml`
  workflow that runs `changesets/action`, wire `CHANGESET_TOKEN`.
- **P0 · release-02:** no publish path for `stackra/*` composer packages.
  Decide: private Satis / Packagist / composer path-repo forever. Document in an
  ADR.
- **P1 · release-03:** semver versions of workspace packages are hand-rolled
  today (`0.0.0` / `0.1.0`) — no `pnpm changeset version` has ever run because
  there is no `.changeset/` directory.

### 8. Bootstrap / boot ordering

**Verdict: PACKAGE-SIDE DESIGN SOUND, APP-SIDE ABSENT.**

- **Only one `bootstrap/app.php` in the workspace:**
  `apps/laravel-template/bootstrap/app.php`. Uses Laravel 13's
  `Application::configure()`.
- **`apps/laravel-template/composer.json` requires zero `stackra/*` packages.**
  Only `laravel/framework: ^13.8` + `laravel/tinker: ^3.0`. The Laravel template
  is untouched from the stock skeleton — none of the workspace's backend
  packages are consumed by any runnable app.
- **`apps/academorix/` has no composer.json, no artisan, no bootstrap.** It is a
  blueprint tree only (blueprints/ + modules/ + sdks/).
- Every backend package declares `extra.laravel.providers` for auto-registration
  (verified on `packages/backend/foundation/composer.json` →
  `Stackra\Foundation\Providers\FoundationServiceProvider`) — sound.
- `packages/backend/foundation/src/Providers/FoundationServiceProvider.php`
  correctly wires a `RequestHandled` listener to clear `CorrelationId::forget()`
  between requests — Octane-safe design.
- `packages/backend/framework/service-provider/` implements attribute-driven
  module lifecycle (`#[AsModule]`, `#[LoadsResources]`, `#[OnRegister]`,
  `#[OnBoot]`, `#[OnTerminate]`, `HasBindings`, `HasMiddleware`, `HasPolicies`,
  `HasRoutes`, ...). Design is cohesive and matches
  `.kiro/steering/package-architecture.md` and
  `.kiro/steering/module-lifecycle.md`.
- Since no app consumes any of these providers, boot ordering is unverified — an
  unknown-until-integrated risk.

**Findings:**

- **P0 · boot-01:** no app registers any `stackra/*` service provider. Every
  claim about boot ordering across `packages/backend/**` (module priorities,
  `#[AsModule(dependencies: [...])]`, `#[OnRegister(priority:)]` ordering) is
  unverifiable until one app boots the packages.
- **P1 · boot-02:** `apps/laravel-template/composer.json` still uses `App\`
  PSR-4 → `app/` (Laravel default). Steering says "src/ as source root across
  every app + package" is non-negotiable — but laravel-template does not
  override `$app->useAppPath()` in `bootstrap/app.php`. When laravel-template
  becomes a real runnable app, this needs to flip.

### CLI (`tools/cli/`)

**Verdict: FUNCTIONAL BUT ISOLATED.**

- `tools/cli/composer.json` → `stackra/cli`, Symfony Console 7 + Illuminate
  Container 11 + Laravel Prompts + OmniTerm.
- Binary at `tools/cli/bin/stackra`.
- No CI job exercises the CLI. No release path (composer publish or otherwise).
  Its `composer install` is on-demand.
- Runs a distinct Illuminate stack (v11) vs the framework packages that target
  Illuminate v13 (per `packages/backend/foundation/composer.json`) — minor
  peer-drift risk when the CLI depends on a shared package.
- No `tools/cli/package.json` — the CLI is Composer-only, not part of the pnpm
  graph.

**Findings:**

- **P2 · cli-01:** version-drift between `tools/cli` (illuminate v11) and
  framework packages (illuminate v13). Pin both to v13 to avoid resolving two
  different Container implementations when the CLI ever consumes a framework
  package.
- **P2 · cli-02:** the CLI is not wired into Turbo. Adding a Turbo shim
  (`install:composer` + `test`) would let CI catch CLI regressions.

## Naming & consistency

**Verdict: NAMING IS CONSISTENT INSIDE EACH LAYER; DRIFT ACROSS LAYERS.**

### Consistent

- **Composer names**: `stackra/<package>` across every `packages/backend/**`
  package. Compliant with `.kiro/steering/package-naming.md`. Domain sub-vendors
  (`stackra-shared/*`, `stackra-observability/*`) appear where the steering
  allows.
- **npm names**: `@stackra/<package>` on frontend + config packages. Consistent.
- **Doppler projects**: `stackra-<slug>` shape uniformly. `dev_<slug>` for
  configs.
- **CI job names**: kebab / title case, one job per concern, per-job
  timeout-minutes set.
- **Turbo task names**: kebab / colon-suffixed variants, aligned with pnpm
  script names.
- **Backend telemetry sub-vendor**: `debug-bar`, `health`, `horizon`,
  `nightwatch`, `sentry` — matches the third-party's own name (the
  `stackra/{name}` rule from `.kiro/steering/package-naming.md`).

### Drift

- **`apps/dashboard`** referenced across 12+ files (CI, CODEOWNERS, labeler,
  preview status, size limit, desktop release, event-authoring steering,
  backend-frontend-alignment plan, workspace tasks) — but the directory does not
  exist. Playwright `testDir: "./e2e"` also doesn't resolve.
- **`apps/api`** + **`apps/ai-service`** + **`apps/template`** referenced across
  steering, ADRs, backend Turbo shims, and every SDK composer description — none
  exist. `apps/laravel-template` is the closest, but it's the stock skeleton.
- **CODEOWNERS `/packages/analytics/`** etc. — the frontend packages live at
  `packages/frontend/analytics/` etc. The CODEOWNERS rules match nothing.
- **Workspace root name mismatch**: repo is `academorix-frontend` but every
  agent charter + reviewer brief targets
  `/Users/akouta/Projects/stackra-frontend`. Steering + charter files carry
  stale paths.

### Proposed convention

**Doppler**

```
project: stackra-<slug> # kebab-cased app / repo name
config: { dev_<slug> | stg_<slug> | prd_<slug> }
```

Already followed. No change needed.

**Backend Horizon supervisors** (when they land)

```
Supervisor names: <app>-<queue>-supervisor # e.g. api-default-supervisor
Queue names: <app>:<domain>[:<priority>] # e.g. api:notifications:high
```

**Docker images** (when they land)

```
Image name: stackra/<app>-<runtime> # e.g. stackra/api-octane
Tag: <git-sha> + <semver> # both
Registry: ghcr.io/stackra/... or ECR
```

## What's solid

- **Turborepo shape**: `globalDependencies`, `globalPassThroughEnv`,
  `dependsOn: ["^build"]`, `inputs` + `outputs` per task. Correct for the
  TypeScript surface.
- **pnpm discipline**: workspace catalog with pinned versions, `overrides` for
  react / react-dom / react-stately / esbuild / prettier (documented rationale
  in comments), `.npmrc` with `engine-strict` + `save-exact` +
  `resolution-mode=highest`.
- **Per-app + root `.doppler.yaml`**: Doppler project split follows the
  documented convention.
- **CI concurrency + permissions**: every workflow scopes permissions narrowly,
  cancels in-progress workflow on same-branch push, sets `timeout-minutes`.
- **Attribute-first service-provider base** (`stackra/service-provider`):
  cohesive, Octane-safe design when the runtime target lands.
- **`FoundationServiceProvider` `RequestHandled` listener**: correctly wired as
  a named static callable (survives Octane worker restart serialisation).
- **Husky + commitlint + lint-staged**: conventional commits enforced at
  commit-msg + at PR title. Types allowlist matches between both gates.
- **HeroUI Pro postinstall auth**: every CI job that runs `pnpm install` wires
  `HEROUI_AUTH_TOKEN` + `HEROUI_PERSONAL_TOKEN` — the private registry
  integration is safe.
- **CI security**: no hard-coded tokens; every secret via `secrets.X`;
  PR-source-based conditional guards on the expensive desktop-build job.
- **`desktop-release.yml`**: signing / notarization plumbing is documented and
  correctly commented-out awaiting cert provisioning.

## Package/app-level ops heatmap

| Area                                        | Docker | Doppler | CI covered | Runtime | Provider ok |
| ------------------------------------------- | :----: | :-----: | :--------: | :-----: | :---------: |
| apps/laravel-template                       |   N    |    Y    |     N      |    N    |     n/a     |
| apps/academorix                             |   N    |   n/a   |     N      |    N    |     n/a     |
| apps/vite-template                          |   N    |    Y    |     ~      |    Y    |     n/a     |
| apps/react-native-template                  |   N    |    Y    |     ~      |    Y    |     n/a     |
| packages/backend/foundation                 |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/console          |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/container        |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/crud             |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/database         |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/events           |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/exceptions       |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/scheduling       |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/service-provider |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/settings         |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/support          |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/framework/* (14 others)    |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/telemetry/horizon          |  n/a   |   n/a   |     N      |    N    |      Y      |
| packages/backend/telemetry/sentry           |  n/a   |   n/a   |     N      |    N    |      Y      |
| packages/backend/telemetry/* (3 others)     |  n/a   |   n/a   |     N      |    N    |      Y      |
| packages/backend/access/* (5)               |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/authorization              |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/billing/* (2)              |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/compliance/* (2)           |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/identity/* (7)             |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/notifications/* (8)        |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/observability/* (3)        |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/platform/* (18)            |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/sdk/* (8)                  |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| packages/backend/shared/* (11)              |  n/a   |   n/a   |     N      |   n/a   |      Y      |
| tools/cli                                   |  n/a   |   n/a   |     N      |    Y    |     n/a     |

Legend: Y = present + correct. ~ = present but drifts (e.g. e2e/ testDir
missing, size-limit empty). N = absent. n/a = not applicable.

## Top-P0 platform findings (ranked by impact)

1. **turbo-01** — 7 backend package Turbo shims reference `pint`/`phpstan`
   binaries under app paths that do not exist (`apps/ai-service/`,
   `apps/template/`). Fix path OR add the apps.
2. **turbo-02** — `config/phpstan-base.neon` + `config/pint.json` missing. Every
   backend `phpstan.neon` include and every backend Turbo shim's `--config` flag
   is broken. Land these files.
3. **container-01** — no `docker/`, no Dockerfile, no `docker-compose.yml`
   anywhere. No production packaging path.
4. **ci-02** — no PHP CI job. Zero workflows exercise composer / pest / phpstan
   / pint. Backend correctness is unverified.
5. **ci-01** — `apps/dashboard/src-tauri` referenced in `ci.yml` +
   `desktop-release.yml` but the path does not exist. First `v*` tag will
   red-build across 4 matrix legs. Restore the app OR remove the workflow.
6. **octane-01** — no app has `config/octane.php`. Every `#[Scoped]` /
   `#[Singleton]` claim across `packages/backend/**` sits on an unverified
   runtime.
7. **horizon-01** — Horizon adapter package ships but no app supervises Horizon.
   No `config/horizon.php` anywhere.
8. **boot-01** — no app registers any `stackra/*` service provider.
   `apps/laravel-template/composer.json` declares zero `stackra/*` dependencies.
   Package-level boot ordering is unverifiable.
9. **release-01** — Changesets scripts wired at root but `.changeset/` directory
   does not exist. No `release.yml` workflow. No release path.
10. **release-02** — no publish destination configured for any of the ~90
    `stackra/*` composer packages. Packagist? Private Satis? Path-repo forever?
    Undecided.
11. **doppler-01** — `docs/doppler.md` referenced by every reviewer charter but
    does not exist.
12. **turbo-04** — `docs/turbo-remote-cache.md` referenced by 4 charters + 2
    steering docs but does not exist. `TURBO_REMOTE_CACHE_SIGNATURE_KEY` not
    documented.

## Suggested fix order

Every batch fits one PR. Order matters — earlier PRs unblock later ones.

**Batch 1 — Restore the missing app + config skeleton (unblocks everything
else)**

- Restore or newly-provision `apps/api` (or explicitly rename target from `api`
  to `academorix`) with `bootstrap/app.php` + `composer.json` that requires the
  framework packages via path repos.
- Land `config/phpstan-base.neon` at repo root + `config/pint.json` at repo
  root. Every backend package's `phpstan.neon` include resolves.
- Land `docs/doppler.md` + `docs/turbo-remote-cache.md`.

**Batch 2 — Repair the Turbo shims**

- Sweep every `packages/backend/*/package.json` for `apps/ai-service/` +
  `apps/template/` references. Repoint to `apps/<canonical-app>/vendor/bin/`.
- Add `analyse`, `test:php`, `lint:php`, `install:composer` to `turbo.json`'s
  `tasks:` map with proper `inputs` + `outputs` so PHP scripts hit the cache.

**Batch 3 — CI drift cleanup**

- Rip out `apps/dashboard/*` references OR restore the dashboard app. Files to
  touch: `.github/workflows/ci.yml` (desktop-build job),
  `.github/workflows/desktop-release.yml`, `.github/CODEOWNERS`,
  `.github/labeler.yml`, `.github/workflows/preview-status.yml`,
  `.github/workflows/size.yml` (`.size-limit.json`), `playwright.config.ts`
  (testDir).
- Rename or delete `.github/dependabot.yml.disabled`. If keeping, re-enable with
  a `.yml` suffix.
- Populate `.size-limit.json` with real budgets OR remove `size.yml`.

**Batch 4 — Add a PHP CI lane**

- New workflow `.github/workflows/php.yml` — `setup-php` action, PHP 8.3 matrix,
  `composer install --working-dir=apps/<app>`,
  `pnpm turbo run lint --filter=@stackra/*` (backend Turbo shims),
  `pnpm turbo run test:php --filter=@stackra/*`,
  `pnpm turbo run analyse --filter=@stackra/*`.

**Batch 5 — Container packaging**

- Add `docker/` root directory with `Dockerfile.api` + `Dockerfile.ai-service`
  (multi-stage: build to runtime), `docker/nginx/`, `docker/entrypoint.sh`.
- Add `docker-compose.yml` for local dev (php-fpm + nginx + redis + postgres).
- Verify images are non-root + multi-stage + no composer in the runtime layer.

**Batch 6 — Horizon + Octane**

- Add `apps/api/config/horizon.php` with `supervisor-1` config + failed-job
  retention.
- Add `apps/api/config/octane.php` and pick a driver (Roadrunner or Swoole).
- Add an Octane smoke test to CI
  (`php artisan octane:start --workers=1 --max-requests=100` + a curl loop).
- Register a `Laravel\Octane\Events\RequestTerminated` listener alongside the
  sync `RequestHandled` in `FoundationServiceProvider`.

**Batch 7 — Release automation**

- Land `.changeset/config.json` with the changeset shape the workspace wants.
- Add `.github/workflows/release.yml` running `changesets/action`. Wire
  `CHANGESET_TOKEN`.
- Decide the composer publish destination (Packagist / private Satis / path-repo
  forever) and write an ADR.

**Batch 8 — Naming + docs sweep**

- Update every charter + steering + spec that references
  `/Users/akouta/Projects/stackra-frontend` if the workspace root is actually
  `academorix-frontend` (or vice versa — pick one).
- Update `.kiro/steering/architecture.md` to reflect the current tree (either
  restore `docker/` or remove the claim).

## Cross-agent handoffs

**security-compliance-reviewer** (in-scope for their lane):

- `apps/laravel-template/.env` exists on disk with an `APP_KEY`. Verify it's
  untracked; add a pre-commit hook to prevent future `.env` staging.
- `docs/doppler.md` missing — the entire secrets flow is undocumented in the
  tree.
- No `TURBO_REMOTE_CACHE_SIGNATURE_KEY` — an unsigned remote cache is an
  injection vector.
- The
  `apps/academorix/src/blueprints/finance/blueprints/payment/data/providers/stripe-config.schema.json`
  file contains Stripe key regex patterns. Confirm these are patterns-only,
  never real values.

**backend-architecture-reviewer** (in-scope for their lane):

- `apps/laravel-template/composer.json` declares zero `stackra/*` deps. There is
  no runnable app that boots the ~90 backend packages — package boot ordering,
  cross-package dependencies, and `#[AsModule(dependencies: [...])]`
  declarations are all unverified.
- `apps/laravel-template/composer.json` still uses `App\` PSR-4 → `app/`.
  Steering `.kiro/steering/architecture.md` says `src/` is the mandatory source
  root — this needs to flip when the app becomes real.
- `FoundationServiceProvider`'s `RequestHandled` listener is Octane-safe; its
  `Laravel\Octane\Events\RequestTerminated` counterpart is not registered.

**docs-adr-steward** (in-scope for their lane):

- Missing docs: `docs/doppler.md`, `docs/turbo-remote-cache.md`,
  `docs/architecture.md`, `docs/migration.md`. Every reviewer charter references
  them.
- Missing ADRs: choose Octane driver (Swoole vs Roadrunner); choose composer
  publish destination (Packagist / Satis / path-repo); document the
  workspace-reorg that removed `apps/dashboard`, `apps/api`, `apps/ai-service`,
  `apps/template`.
- CODEOWNERS + labeler + preview workflow reference package paths that no longer
  exist — sweep in one PR.

**delivery-lead / chief-orchestrator** (routing decision):

- The `backend-platform-reviewer` cannot complete a real Phase 5 review of
  ship + run until a runnable app exists. Route the "backend runtime target"
  decision to `solution-architect` + `product-lead` before another Phase 5
  attempt.

## Open questions for humans

1. **Is the backend actually shipping?** No runnable app under `apps/` consumes
   `packages/backend/**`. What's the plan — provision `apps/api`, port to
   `apps/academorix`, or absorb into a customer repo?
2. **Docker strategy:** the entire steering + AGENTS surface promises
   Dockerfiles + docker-compose. Is that deferred, or is production going to
   Laravel Cloud / Vercel / a serverless target?
3. **Octane target:** Swoole or Roadrunner? Steering says both are supported. No
   app has picked one.
4. **Release automation:** who publishes composer packages when they're ready?
   Packagist? Private Satis? Composer path-repo only (workspace-internal)?
5. **CI drift cleanup:** should `apps/dashboard/*` references across CI +
   CODEOWNERS + labeler + preview-status + size + desktop-release be swept in
   one PR, or should the dashboard app be re-provisioned first?
6. **The .env at apps/laravel-template:** was that committed by `composer setup`
   for local dev, or leaked from an earlier commit? Confirm it's untracked;
   document a `pre-push` hook that grep-scans staged content.
7. **CLI publishing:** is `tools/cli` intended for private (workspace-only) use,
   or for global `composer global require`?
8. **Dependabot re-enable:** the file exists disabled. What was the concern?
   Auth-token collision with HeroUI Pro postinstall?
9. **Turbo remote cache:** are `TURBO_TOKEN` / `TURBO_TEAM` set for the repo?
   The CI passes them through — is anyone actually caching?
10. **Workspace root name:** the current directory is `academorix-frontend` but
    every steering + charter file targets `stackra-frontend`. Which is
    canonical?

---

_Report generated 2026-07-21 by backend-platform-reviewer (Phase 5 Verify)._
