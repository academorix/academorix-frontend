# Structure Tasks

Reorganize the workspace from flat `packages/<name>/` + `backend-packages/` into
the two-lane monorepo layout: `packages/backend/**` + `packages/frontend/**` +
`packages/config/**`. Then fix every relative path that broke because the
directory depth changed.

**File-tree ownership**:

- Every physical move under `packages/**` and `backend-packages/**`
- `pnpm-workspace.yaml`
- `scripts/fix-workspace-relative-paths.py`
- Every `tsconfig.json`, `tsup.config.ts`, `package.json` under `packages/**`
  for the `extends` / `import` path updates (NOT the content of these files —
  only the relative-path bump)

**No git operations.**

---

## Target layout

```
packages/
├── backend/                     ← was: backend-packages/*
│   ├── foundation/              ← was: backend-packages/foundation/
│   ├── shared/
│   │   └── foundation/          ← was: backend-packages/shared/foundation/
│   ├── framework/*/             ← 17 packages
│   ├── telemetry/*/             ← 5 packages
│   ├── authorization/           ← was: backend-packages/authorization/
│   ├── compliance/
│   │   ├── architecture/
│   │   ├── compliance/
│   │   └── retention/
│   ├── access/*/                ← 5 packages
│   ├── billing/*/               ← 2 packages
│   ├── finance/*/               ← 16 packages (all, incl. skip-listed for cat.)
│   ├── notifications/*/         ← 8 packages
│   ├── observability/*/         ← 3 packages
│   ├── shared/*/                ← 10 non-foundation packages
│   ├── identity/*/              ← 7 packages
│   ├── growth/*/                ← 5 packages
│   ├── platform/*/              ← 23 packages (all, incl. skip-listed)
│   ├── sdk/*/                   ← 8 packages
│   ├── sports/*/                ← 21 packages
│   ├── products/*/              ← 1 package
│   └── workflow/*/              ← 2 packages
│
├── frontend/                    ← was: packages/*
│   ├── access-control/
│   ├── actions/
│   ├── ai/
│   ├── analytics/
│   ├── approvals/
│   ├── auth/
│   ├── cache/
│   ├── collaboration/
│   ├── config/
│   ├── console/
│   ├── consent/
│   ├── container/
│   ├── contracts/               ← was: packages/contracts-app/
│   ├── coordinator/
│   ├── csp/
│   ├── dashboard/
│   ├── decorators/
│   ├── devtools/
│   ├── error/
│   ├── events/
│   ├── http/
│   ├── i18n/
│   ├── identity/
│   ├── invitations/
│   ├── kbd/
│   ├── logger/
│   ├── monitoring/
│   ├── navigation/
│   ├── network/
│   ├── notifications/
│   ├── pipeline/
│   ├── pwa/
│   ├── query/
│   ├── queue/
│   ├── realtime/
│   ├── routing/
│   ├── scheduler/
│   ├── scope/
│   ├── sdui/
│   ├── settings/
│   ├── state/
│   ├── storage/
│   ├── support/
│   ├── sync/
│   ├── testing/
│   ├── theming/
│   ├── typescript-config/       ← shared internal TS config package
│   ├── ui/
│   └── vite/
│                                 ← 49 packages total (some may vary; see verify)
│
└── config/                       ← was: packages/repo-config/*
    ├── eslint/                   ← was: packages/repo-config/eslint/
    └── tsconfig/                 ← was: packages/repo-config/tsconfig/
```

Total: ~143 backend + ~49 frontend + 2 config = ~194 package directories, with
~156 catalog.json files (per `catalog-tasks.md`) and ~50 frontend package.json
entries visible to pnpm.

---

## 1. Physical moves

### 1.1 Backend

Move every package from `backend-packages/*` to `packages/backend/*`, preserving
sub-directory shape:

```sh
mkdir -p packages/backend
# Move top-level dirs preserving hierarchy
for tier in access authorization billing compliance finance foundation framework \
            growth identity notifications observability platform products sdk \
            shared sports telemetry workflow ; do
  [ -d backend-packages/$tier ] && mv backend-packages/$tier packages/backend/
done
rmdir backend-packages 2>/dev/null
```

**BUT — per workspace steering, no `for` loops in tool-invoked commands.** The
steward doing this move enumerates the moves via parallel `smart_relocate` calls
or a Python script that shells to `mv` in a single subprocess:

```python
# scripts/reorganize-backend.py — one-shot mover
import shutil, os
BACKEND_TIERS = [
    'access','authorization','billing','compliance','finance','foundation',
    'framework','growth','identity','notifications','observability','platform',
    'products','sdk','shared','sports','telemetry','workflow',
]
os.makedirs('packages/backend', exist_ok=True)
for t in BACKEND_TIERS:
    src = f'backend-packages/{t}'
    if os.path.isdir(src):
        shutil.move(src, f'packages/backend/{t}')
try:
    os.rmdir('backend-packages')
except OSError:
    pass
```

### 1.2 Frontend

Create `packages/frontend/` and move every non-config sub-directory of
`packages/` into it (except `backend/`, `config/`, and already-nested folders):

```python
# Same script continues
FRONTEND_LEAF_MARKERS = ('package.json',)  # a dir with package.json is a package
for name in list(os.listdir('packages')):
    src = f'packages/{name}'
    if not os.path.isdir(src): continue
    if name in ('backend', 'frontend', 'config'): continue
    # skip legacy repo-config subtree — handled below
    if name == 'repo-config': continue
    # Contracts-app renames on the way
    dest_name = 'contracts' if name == 'contracts-app' else name
    shutil.move(src, f'packages/frontend/{dest_name}')
```

### 1.3 Config packages

The old `packages/repo-config/{eslint,tsconfig}/` becomes
`packages/config/{eslint,tsconfig}/`:

```python
if os.path.isdir('packages/repo-config'):
    os.makedirs('packages/config', exist_ok=True)
    for sub in os.listdir('packages/repo-config'):
        shutil.move(f'packages/repo-config/{sub}', f'packages/config/{sub}')
    os.rmdir('packages/repo-config')
```

Note: `packages/repo-config/tailwind/` was dropped upstream (not recreated). If
the sub-agent finds it, it can be safely deleted — no citations remain.

---

## 2. `pnpm-workspace.yaml`

Post-move, the workspace globs need to match the new depth. Full replacement:

```yaml
packages:
  # Apps
  - "apps/*"

  # Frontend workspace packages (depth 2 under packages/frontend)
  - "packages/frontend/*"

  # Shared config packages (depth 2 under packages/config)
  - "packages/config/*"

  # Tools (CLI, migrator, future)
  - "tools/*"

# Backend PHP packages under packages/backend/** are Composer-managed
# and intentionally NOT in the pnpm workspace globs.

catalog:
  # (existing default-catalog entries preserved — see workspace.md handling
  # excluded from this task; DO NOT touch catalog: block content here)

catalogs:
  expo:
    expo-router: ^57.0.0
  react-native:
    heroui-native: ^1.0.5
    react-native: ^0.86.0
    react-native-gesture-handler: ^2.28.0
    react-native-reanimated: ^4.5.0
    react-native-safe-area-context: ^5.6.0

onlyBuiltDependencies:
  # (existing entries preserved — this task adds heroui-native-pro
  # only if it isn't already there)
  - heroui-native-pro
  - heroui-pro
  - "@heroui-pro/react"
```

**Do NOT touch** the `catalog:` (singular) block — that's owned by
workspace.md-scope which this file excludes. Only `catalogs:` (plural), the
workspace `packages:` list, and `onlyBuiltDependencies` are in scope here.

---

## 3. Fix relative paths in `tsconfig.json` and `tsup.config.ts`

Every frontend package's `tsconfig.json` extends a root base and every
`tsup.config.ts` imports a root helper. Pre-move these were at depth 2
(`../../tsconfig.base.json`). Post-move they're at depth 3
(`../../../tsconfig.base.json`).

### `scripts/fix-workspace-relative-paths.py`

Idempotent script. Walks every `packages/frontend/*/tsconfig.json` and
`packages/frontend/*/tsup.config.ts`, rewrites two-hop references to three-hop,
preserves anything already at three-hop.

**Handles both quote styles** — `"../../..."` and `'../../...'`.

Patterns to migrate:

| From                              | To                                   |
| --------------------------------- | ------------------------------------ |
| `"../../tsconfig.base.json"`      | `"../../../tsconfig.base.json"`      |
| `"../../tsconfig.react.json"`     | `"../../../tsconfig.react.json"`     |
| `from "../../tsup.config.base"`   | `from "../../../tsup.config.base"`   |
| `from '../../tsup.config.base'`   | `from '../../../tsup.config.base'`   |
| `from "../../vitest.config.base"` | `from "../../../vitest.config.base"` |

### Script signature

```python
# python3 scripts/fix-workspace-relative-paths.py [--dry-run] [--quiet]
```

### Docblock

Top-of-file: purpose, invocation, idempotency guarantee, exit codes.

### Idempotency

Running the script twice must be a no-op. If a file already has `../../../`,
skip. Detect via regex match on the CURRENT contents before substituting.

---

## 4. Break dependency cycles

Two known workspace cycles Turbo will reject:

### 4.1 `@stackra/ui` ↔ `@stackra/actions`

Both packages historically declared each other as peer + dev deps, but only
`@stackra/actions` actually imports from `@stackra/ui` at source level. The
reverse edge is dead.

Fix in `packages/frontend/ui/package.json`:

- Remove `@stackra/actions` from `peerDependencies`
- Remove `@stackra/actions` entry from `peerDependenciesMeta`
- Remove `@stackra/actions` from `devDependencies`

Leave `packages/frontend/actions/package.json` unchanged — it correctly depends
on `@stackra/ui`.

### 4.2 `@stackra/storage` ↔ `@stackra/devtools`

`@stackra/devtools` declared `@stackra/storage` as peer + dev but never imports
from it. The reverse edge is real (`@stackra/storage` imports from
`@stackra/devtools` in two files).

Fix in `packages/frontend/devtools/package.json`:

- Remove `@stackra/storage` from `peerDependencies`
- Remove `@stackra/storage` entry from `peerDependenciesMeta`
- Remove `@stackra/storage` from `devDependencies`

Leave `packages/frontend/storage/package.json` alone — the storage → devtools
direction is real.

---

## 5. Fix implicit peer deps surfaced by the move

Several packages import from workspace siblings without declaring the
dependency. Detected during the workspace.md-era build attempts; recreated fixes
here (these fixes are separate from workspace.md scope because they're
structural, not config-hardening):

### `@stackra/network` needs `@stackra/ui`

In `packages/frontend/network/package.json`:

```jsonc
"peerDependencies": {
  "@stackra/ui": "workspace:^"
},
"peerDependenciesMeta": {
  "@stackra/ui": {"optional": true}
},
"devDependencies": {
  "@stackra/ui": "workspace:*"
}
```

### `@stackra/vite` needs `@stackra/console`, `container`, `contracts`, `support`

All four added as `workspace:^` peer + `workspace:*` dev.

### `@stackra/dashboard` needs `@stackra/routing`

Added as `workspace:^` peer + `workspace:*` dev.

### `@stackra/routing` needs optional `expo-router` + `react-native`

Both added under `peerDependencies` with `"optional": true` in
`peerDependenciesMeta`.

### `@stackra/storage` needs `@stackra/devtools` (restore the direction we keep)

Restored in `peerDependencies` as `workspace:^`.

---

## 6. Handle contracts-app rename

`packages/contracts-app/` → `packages/frontend/contracts/`. Its own
`package.json` name field probably says `@stackra/contracts` already — verify.
If it's still `@academorix/contracts` or another legacy scope, leave the name
alone (this file doesn't own package name changes) and flag for a follow-up.

Any workspace file that references `packages/contracts-app` needs a one-shot
update — grep for it and fix:

```sh
grep -rln 'packages/contracts-app' \
  --include='*.json' --include='*.yaml' --include='*.yml' \
  --include='*.md' --include='*.ts' --include='*.mjs' \
  . 2>/dev/null | grep -v node_modules | grep -v '\.git/'
```

Every hit → `packages/frontend/contracts`.

---

## 7. Post-move `pnpm install`

After all moves + path fixes + workspace.yaml update, a fresh lock-and-install
must be run:

```sh
# Nuke stale lock + node_modules trees
rm -rf pnpm-lock.yaml
rm -rf node_modules
find packages -name node_modules -type d -prune -exec rm -rf {} + 2>/dev/null
find packages -name dist -type d -not -path '*/node_modules/*' -prune -exec rm -rf {} + 2>/dev/null
find packages -name .turbo -type d -not -path '*/node_modules/*' -prune -exec rm -rf {} + 2>/dev/null
rm -rf .turbo

# Fresh install — regenerates every symlink against new tree
pnpm install
```

pnpm's symlinks are relative-path — moving a package one dir deeper breaks every
`packages/<pkg>/node_modules/rimraf → ../../.pnpm/...` link because the relative
depth changed. Only a fresh install fixes this cleanly.

---

## Verify

```sh
# 1. Backend + frontend + config tree exist
ls -d packages/backend packages/frontend packages/config

# 2. Old top-level containers are gone
ls -d backend-packages packages/repo-config packages/contracts-app 2>&1 | grep -v 'No such' && echo 'LEGACY DIRS REMAIN'

# 3. Backend package count is roughly what we expect
find packages/backend -maxdepth 3 -name composer.json | wc -l   # → ~143

# 4. Frontend package count is roughly what we expect
find packages/frontend -maxdepth 2 -name package.json | wc -l   # → ~49

# 5. Config packages present
ls packages/config/eslint/package.json packages/config/tsconfig/package.json

# 6. Zero references to old paths in workspace files
grep -rlnE 'backend-packages/|packages/repo-config|packages/contracts-app' \
  --include='*.json' --include='*.yaml' --include='*.yml' \
  --include='*.md' --include='*.ts' --include='*.mjs' \
  . 2>/dev/null | grep -v node_modules | grep -v '\.git/' | grep -v '\.ref/' | head
# → should be empty or only reference docs like tasks-*.md that MENTION the old paths

# 7. Every tsconfig extends a valid path
python3 - <<'PY'
import json, pathlib
bad=[]
for p in pathlib.Path('packages').rglob('tsconfig.json'):
    if 'node_modules' in str(p): continue
    try:
        d = json.loads(p.read_text())
        ext = d.get('extends')
        if ext and ext.startswith('../'):
            resolved = (p.parent / ext).resolve()
            if not resolved.exists():
                bad.append((str(p), ext))
    except json.JSONDecodeError:
        pass  # jsonc/comments — skip
if bad:
    print('BAD EXTENDS:', *bad, sep='\n')
else:
    print('All tsconfig extends resolve.')
PY

# 8. Fix-paths script is idempotent
python3 scripts/fix-workspace-relative-paths.py --dry-run --quiet
# → 0 changes on a second run

# 9. pnpm can enumerate workspace projects
pnpm ls -r --depth=-1 --parseable 2>&1 | wc -l   # → ~55 (49 frontend + 2 config + 3 apps + tools/cli)

# 10. Cycles broken
pnpm install --lockfile-only 2>&1 | grep -iE 'cyclic|circular' | head
# → empty
```

---

## Source of truth

`fullplan.md` — search for "packages/frontend", "packages/backend",
"backend-packages", "packages/repo-config", "packages/config", "contracts-app",
"cycle", "fix-workspace-relative-paths", "symlink". Every rename decision and
dependency-cycle fix is already locked in fullplan.md.

The `packages/config/{eslint,tsconfig}` packages themselves (their package.json
names, exports maps, contents) are OUT of scope here — that's config-extraction
work that lives in workspace.md, which we exclude. This file's job is only the
physical move + workspace glob + depth-fix, not the shape of what lives inside
those config packages.
