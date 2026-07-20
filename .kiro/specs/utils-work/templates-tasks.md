# Templates Tasks

Standardize the three template apps (`laravel-template`, `vite-template`,
`react-native-template`) with a unified Doppler + `.env` + `.kiro/settings`
shape. Also add a workspace-root Doppler config for cross-workspace secrets.

**File-tree ownership**:

- `.doppler.yaml` at workspace root
- Root `package.json` — Doppler helper scripts ONLY (`doppler:login`,
  `doppler:setup`, `doppler:me`). Nothing else in root `package.json` is in
  scope here.
- Everything under `apps/laravel-template/`, `apps/vite-template/`,
  `apps/react-native-template/`

**No git operations.**

---

## Design decisions (locked from fullplan.md)

- **Env layout**: **No `environments/` folder.** Each framework's `.env` and
  `.env.example` live at its own project root (Laravel expects them there; Vite
  and RN keep them there too for consistency).
- **Doppler wraps runtime, not static analysis.** `lint` stays direct (no
  `doppler run --`); `dev` / `start` / `ios` / `android` / dev-time scripts DO
  wrap with `doppler run --`.
- **`build` in templates does NOT wrap Doppler.** Fresh clones haven't
  authenticated Doppler yet; a wrapped `build` would fail out of the box. Users
  who need env-injected builds run `doppler run -- pnpm build` explicitly.
- **No `environments/` build override.** Vite's default env-loading and
  Laravel's `.env` auto-load handle the offline case; Doppler handles the "real"
  flow.
- **`pnpm` version is inherited from workspace root.** No template declares its
  own `packageManager`.
- **No `AGENTS.md` per template. No `CLAUDE.md` per template.** Workspace-root
  `.kiro/steering/` is the source of truth.
- **`.claude/` per template is optional.** `laravel-template` keeps its existing
  `.claude/skills/`; the other two don't need one.
- **Nested git repo in `react-native-template` gets nuked.**
  `npx react-native init` creates one; it breaks root git workflows.

---

## Phase A — Workspace-root additions

### A.1 Root `.doppler.yaml` (workspace-wide secrets)

Pins the workspace root to a single Doppler project. Covers Turbo remote cache,
HeroUI Pro tokens, other workspace-wide values.

```yaml
setup:
  project: academorix-monorepo
  config: dev_monorepo

# This file pins the workspace root to Doppler's academorix-monorepo project.
# Doppler CLI: `doppler run -- pnpm turbo run build` — all scripts wrapped at root
# pull secrets from THIS project's dev_monorepo config.
#
# What belongs here (workspace-wide):
#   - TURBO_TOKEN, TURBO_TEAM        (remote cache)
#   - HEROUI_AUTH_TOKEN              (HeroUI Pro postinstall)
#   - HEROUI_PERSONAL_TOKEN          (HeroUI Pro CLI)
#   - CHANGESET_GITHUB_TOKEN         (release automation)
#
# What does NOT belong here (per-app):
#   - App-specific API keys           (see apps/<name>/.doppler.yaml)
#   - Database URLs                   (per-app)
#   - Third-party integration keys    (per-app)
```

### A.2 Root `package.json` Doppler helpers

Replace any dead `secrets:*` scripts (pre-move references to deleted
`apps/dashboard`, `apps/landing-page`) with three generic helpers:

```json
"doppler:login": "doppler login",
"doppler:setup": "doppler setup --no-interactive",
"doppler:me": "doppler me"
```

**Only edit these three script entries.** Every other line in root
`package.json` is outside this task's scope.

### A.3 Nuke nested git repo in `react-native-template`

```sh
rm -rf apps/react-native-template/.git
```

`npx react-native init` creates a nested `.git/`; must be gone so the root git
repo sees the template as regular content.

---

## Phase B — Per-template standardization

Every template gets these five artifacts. Files marked `NEW` didn't exist
before; files marked `EDIT` need targeted changes.

### B.1 `apps/laravel-template/`

#### `apps/laravel-template/.doppler.yaml` (NEW)

```yaml
setup:
  project: academorix-laravel-template
  config: dev_laravel_template
```

#### `apps/laravel-template/.env.example` (EXISTING — leave alone)

Laravel ships its own `.env.example` via `laravel new`. Do not overwrite.

#### `apps/laravel-template/.gitignore` (EDIT)

Ensure it has an env block near the top:

```
# Environment
.env
.env.local
.env.*.local
```

#### `apps/laravel-template/package.json` (EDIT)

Wrap Vite dev only. `build` stays unwrapped (frontend build shouldn't need env;
Vite reads its own `.env` files at build time from the app root). Only touch the
specific `scripts` block:

```jsonc
"scripts": {
  "dev": "doppler run -- vite",
  "build": "vite build",
  "lint": "eslint resources/",
  "format": "prettier --write ."
}
```

#### `apps/laravel-template/composer.json` (EDIT)

Wrap `dev` (Artisan serve + Horizon + queue + pail) and `test` (Pest) with
`doppler run --`. Leave `setup`/`post-create-project-cmd` unwrapped so
first-time clones work without Doppler.

```jsonc
"scripts": {
  "dev": "doppler run -- concurrently -c \"#93c5fd,#c4b5fd,#fb7185,#fdba74\" \"php artisan serve\" \"php artisan queue:listen --tries=1\" \"php artisan pail --timeout=0\" \"npm run dev\" --names=server,queue,logs,vite",
  "test": "doppler run -- php artisan test",
  "setup": "cp -n .env.example .env && composer install && npm install && php artisan key:generate && php artisan migrate --seed"
}
```

#### `apps/laravel-template/.kiro/settings/mcp.json` (EXISTING — leave alone)

Already ships with `laravel-boost` MCP. Do not touch.

### B.2 `apps/vite-template/`

#### `apps/vite-template/.doppler.yaml` (NEW)

```yaml
setup:
  project: academorix-vite-template
  config: dev_vite_template
```

#### `apps/vite-template/.env.example` (NEW)

```
# --------------------------------------------------------------------
# Vite (VITE_ prefix required to expose to the client bundle)
# --------------------------------------------------------------------
VITE_APP_NAME="Academorix"
VITE_API_BASE_URL="http://localhost:8000/api"

# --------------------------------------------------------------------
# Feature toggles (client-visible)
# --------------------------------------------------------------------
VITE_FEATURE_DEVTOOLS=true

# --------------------------------------------------------------------
# Any additional runtime keys — document them here so consumers know
# what to configure. Actual values live in Doppler (dev_vite_template).
# --------------------------------------------------------------------
```

#### `apps/vite-template/.gitignore` (EDIT)

Ensure it has an env block near the top:

```
# Environment
.env
.env.local
.env.*.local
```

#### `apps/vite-template/package.json` (EDIT)

Only the `scripts` block:

```jsonc
"scripts": {
  "dev": "doppler run -- vite",
  "build": "tsc && doppler run -- vite build",
  "preview": "doppler run -- vite preview",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit"
}
```

Note: `tsc` runs before Vite build; it doesn't need env, so wrap only
`vite build`.

#### `apps/vite-template/.kiro/settings/mcp.json` (NEW)

Empty baseline. Workspace root's `.kiro/settings/mcp.json` is the source of
truth for MCP servers; per-app override only if the app genuinely needs a
different server. Vite/RN don't.

```json
{
  "mcpServers": {}
}
```

### B.3 `apps/react-native-template/`

#### `apps/react-native-template/.doppler.yaml` (NEW)

```yaml
setup:
  project: academorix-react-native-template
  config: dev_react_native_template
```

#### `apps/react-native-template/.env.example` (NEW)

```
# --------------------------------------------------------------------
# React Native template (bare workflow, non-Expo)
# --------------------------------------------------------------------
API_BASE_URL="http://localhost:8000/api"

# Sentry (leave blank for local dev; populate in Doppler)
SENTRY_DSN=""

# --------------------------------------------------------------------
# Metro passes environment variables through the shell — access in
# runtime code via `import Config from 'react-native-config'` OR via
# Metro-injected process.env when using expo-modules.
#
# Actual values live in Doppler (dev_react_native_template).
# --------------------------------------------------------------------
```

#### `apps/react-native-template/.gitignore` (EDIT)

Ensure env block:

```
# Environment
.env
.env.local
.env.*.local
```

#### `apps/react-native-template/package.json` (EDIT)

Wrap `android`, `ios`, `start`, `test`. Leave `lint` unwrapped:

```jsonc
"scripts": {
  "android": "doppler run -- react-native run-android",
  "ios": "doppler run -- react-native run-ios",
  "start": "doppler run -- react-native start",
  "test": "doppler run -- jest",
  "lint": "eslint ."
}
```

#### `apps/react-native-template/.kiro/settings/mcp.json` (NEW)

```json
{
  "mcpServers": {}
}
```

### B.4 Common `.gitignore` addition — Doppler local state

Every template's `.gitignore` also gets a `.doppler/` line so Doppler's local
scratch state (per-workstation config) never lands in git. Add to whichever
section of the file makes sense (usually after env):

```
# Doppler local state
.doppler/
```

Root `.gitignore` may already have this — this task's edit is per-template only.

---

## Phase C — .kiro / .claude conventions

### C.1 Laravel template (already correct — no work)

`apps/laravel-template/.kiro/settings/` + `apps/laravel-template/.claude/`
already exist and are correctly shaped. Do not modify.

### C.2 Vite template (add `.kiro/settings/` only)

Already covered by §B.2 above.

### C.3 React Native template (add `.kiro/settings/` only)

Already covered by §B.3 above.

**No `AGENTS.md` in any template. No `CLAUDE.md` in any template.**
`.kiro/steering/**` at workspace root is the canonical AI conventions document —
templates inherit it.

---

## Coordination with `structure-tasks.md`

Templates live in `apps/`, not `packages/`. They are unaffected by the
`packages/frontend/` reorganization. This task and `structure-tasks.md` can run
in parallel — no file-tree overlap.

---

## Verify

```sh
# 1. Root .doppler.yaml exists and pins the workspace project
cat .doppler.yaml | grep -E 'project:|config:'
# → project: academorix-monorepo
# → config: dev_monorepo

# 2. Nested .git in RN template is gone
ls apps/react-native-template/.git 2>&1 | grep -v 'No such' && echo 'STILL PRESENT'

# 3. Each template has .doppler.yaml, .env.example, .kiro/settings/mcp.json
for app in laravel-template vite-template react-native-template ; do
  echo "── apps/$app ──────────"
  for f in .doppler.yaml .env.example .gitignore .kiro/settings/mcp.json ; do
    if [ -f "apps/$app/$f" ] ; then echo "  ✓ $f" ; else echo "  ✗ $f MISSING" ; fi
  done
  echo "  --- scripts wrapping doppler run --"
  grep -E '"(dev|build|start|ios|android|preview|test)"' apps/$app/package.json 2>/dev/null | head -6
done

# 4. Root package.json has doppler:login, doppler:setup, doppler:me
grep -E '"doppler:(login|setup|me)"' package.json | wc -l   # → 3

# 5. No template overrides packageManager (pnpm inherits from root)
grep -H '"packageManager"' apps/*/package.json 2>/dev/null | head   # → empty

# 6. Doppler CLI parses each .doppler.yaml (dry — no auth needed)
for app in laravel-template vite-template react-native-template ; do
  doppler configure --scope apps/$app 2>&1 | tail -2 || true
done
```

**Note**: verification loops with `for` are prose-only in this doc. When the
sub-agent runs them, it uses parallel commands or `find -exec` per the
shell-commands steering.

---

## Doppler project state (informational)

The three per-template Doppler projects don't need to exist on Doppler's side
for the `.doppler.yaml` files to be authored. Actual project provisioning is a
follow-up when the templates are first used:

```sh
doppler projects create academorix-monorepo
doppler projects create academorix-laravel-template
doppler projects create academorix-vite-template
doppler projects create academorix-react-native-template

# Then, in each app dir:
cd apps/laravel-template && doppler setup   # picks up .doppler.yaml
```

That's out of scope for this task — the task only writes the config files that
pin them.

---

## Source of truth

`fullplan.md` — search for "Phase A", "Phase B", ".doppler.yaml",
"dev_monorepo", "dev_laravel_template", "dev_vite_template",
"dev_react_native_template", "apps/react-native-template/.git", "AGENTS.md",
"CLAUDE.md", "doppler:login". Every decision is already locked in fullplan.md.
