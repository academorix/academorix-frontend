# Cleanup Tasks

Delete completed/unused artifacts from `.ref/`, `scripts/`, and `.kiro/`. Total
savings: ~813 MB across three trees.

**File-tree ownership**: delete-only inside `.ref/**`, `scripts/**`,
`.kiro/reports/**`, and three specific completed specs under `.kiro/specs/**`.
Never delete anything outside these paths.

**No git operations.**

---

## Preflight audit — recoverability

Different trees have different recoverability profiles:

| Tree       | In `.gitignore`? | Recoverable?                                                      |
| ---------- | ---------------- | ----------------------------------------------------------------- |
| `.ref/`    | YES              | **NO** — deletions are permanent                                  |
| `scripts/` | no               | Yes — git-tracked, `git checkout HEAD -- scripts/<file>` restores |
| `.kiro/`   | no               | Yes — git-tracked, `git checkout HEAD -- .kiro/<path>` restores   |

Two special cases in `scripts/`:

- Two files are untracked (never committed): `list-blueprint-only-modules.sh`
  and `survey-modules.py`. Deleting these is irrecoverable via git. **Do NOT
  delete these two automatically** — flag for the user to decide.

---

## Target 1 — `.ref/` cleanup (~800 MB freed)

### 1.1 Big three (789 MB, 0 citations)

```
.ref/done/               339 MB   named "done"; 0 citations
.ref/medusa-develop/     300 MB   Medusa e-commerce framework snapshot
.ref/api/                150 MB   pre-migration API snapshot; supplanted
                                  by packages/backend/
```

### 1.2 Mid-size zero-citation references (~15 MB total)

Delete all of these:

```
.ref/devtools-main/           3.8 MB
.ref/tenancy-master/          1.5 MB
.ref/tenancy/                 1.7 MB
.ref/laravel-modules-master/  1.0 MB
.ref/AI/                      940 KB
.ref/Laravel-Excel-3.1/       916 KB
.ref/Geography/               856 KB
.ref/Geofencing/              732 KB
.ref/navigation/              680 KB
.ref/import-export/           652 KB
.ref/webhook copy/            392 KB   (has a SPACE in the name)
.ref/webhook/                 364 KB
.ref/sdk/                     328 KB
.ref/localization/            324 KB
.ref/workflow/                324 KB
.ref/settings/                312 KB
.ref/versioning/              296 KB
.ref/versioning copy/         176 KB   (has a SPACE in the name)
```

### 1.3 Loose files (0 citations)

```
.ref/sdui-example.json          54 KB
.ref/sdui-view-edit-example.json 59 KB
.ref/image.png                    ~1 MB
.ref/image copy.png               ~1 MB
```

### 1.4 Every `.DS_Store` under `.ref/`

```sh
find .ref -name .DS_Store -type f -delete
```

### 1.5 KEEP — still cited by live code/docs

Do NOT delete anything below:

| Path                                         | Cited by                                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `.ref/DOMAIN_MODULES_BLUEPRINT.md` (~121 KB) | `spec-intake-analyst.md`, `AGENT_ROSTER.md`                                                                     |
| `.ref/packages/` (~7.3 MB)                   | `.kiro/agents/translator.md`, hook config, container + queue reference source                                   |
| `.ref/auth/` (~1.1 MB)                       | `packages/frontend/auth/src/core/auth.module.ts`                                                                |
| `.ref/config-master/` (~528 KB)              | `.kiro/specs/stackra-config-package/PLAN.md` (spec deleted below — reference kept for historical trace via ADR) |
| `.ref/config/` (~420 KB)                     | Same as above                                                                                                   |
| `.ref/mapped-types-master/` (~368 KB)        | `.kiro/specs/stackra-routing-package/PLAN.md` (spec deleted below — same reasoning)                             |
| `.ref/vite-config/` (~248 KB)                | `packages/frontend/vite/README.md`                                                                              |
| `.ref/installer-master/` (~120 KB)           | `tools/cli/README.md`                                                                                           |
| `.ref/schemas/` (~4 KB)                      | 8 files across CLI catalog + agent hooks                                                                        |

**Known follow-ups** (not blocking — flag in report, not deletions):

- `.ref/packages/i18n/` is referenced by `.kiro/agents/translator.md` but
  doesn't exist in the current `.ref/packages/` tree. Broken reference; author
  of translator.md should update.
- Both `-master` refs (`config-master`, `mapped-types-master`) exist because
  their consumers were the shipped-package specs deleted in §3. Kept for now;
  the follow-up removes them if consumers stay dead.

### 1.6 Post-cleanup shape

`.ref/` should hold roughly 9 items totaling ~6.6 MB after the cleanup.

---

## Target 2 — `scripts/` cleanup (~200 KB freed)

### 2.1 Delete (27 tracked, one-shot completed migrations)

Group by purpose (all can be deleted in one `rm -f` batch):

**Wave/ULID promotions** (8):

- `promote-wave2a-ulid-prefixes.py`
- `promote-wave2b-ulid-prefixes.py`
- `promote-wave3a-ulid-prefixes.py`
- `promote-wave3bc-ulid-prefixes.py`
- `promote-wave4-wave6-ulid-prefixes.py`
- `promote-wave5-ulid-prefixes.py`
- `promote-wave7-a-ulid-prefixes.py`
- `update-wave1-ulid-prefixes.py`

**Wave-1 fixups** (3):

- `fix-wave1-priorities.py`
- `fix-workspace-terms-wave1.py`
- `normalize-wave1-module-deps.py`

**Workspace ↔ tenancy renames** (5) — ADR-0017 complete:

- `rename-tenancy-to-workspaces.py`
- `rename-workspaces-to-tenancy.py`
- `rename-workspaces-to-tenancy-round2.py`
- `fix-tenancy-prose.py`
- `fix-tenants-to-tenancy.py`

**Namespace fix** (1):

- `fix-composer-ns.py`

**Historical migrations** (4):

- `prune-duplicate-migrations.py`
- `migrate-console.mjs`
- `migrate-to-catalog.mjs`
- `strip-stackra-ui.mjs`

**Blueprint/SDK generators — never wired** (4):

- `check-impl-collisions.sh`
- `gen-25-sdks.sh`
- `gen-all-modules.sh`
- `import-real-implementations.sh`

**Never-referenced utilities** (2):

- `smoke-publishables.mjs`
- `verify-package-root.mjs`

### 2.2 KEEP

- `toggle-jit.mjs` — actively wired to 5 root scripts (`pnpm jit`, `jit:check`,
  `jit:rewrite`, `compile`, `compile:check`)

### 2.3 FLAG for user (do NOT delete)

Two untracked files. Both were recently created (July 19-20) and never
committed. Zero external citations, but "untracked" means git can't restore them
if deleted. Leave alone, mention in report:

- `list-blueprint-only-modules.sh` (~1.2 KB, 2026-07-20)
- `survey-modules.py` (~4.4 KB, 2026-07-19)

### 2.4 Broken steering references (informational — not deletions)

Five scripts are referenced in steering / ADR docs but were never implemented.
These are documentation drift, not cleanup targets:

- `scripts/validate-module-graph.py` — cited by `module-graph.md`,
  `priority-ordering.md`, `ulid-prefix-registry.md`,
  `platform-service-implementation/README.md`
- `scripts/new-package.sh` — cited by `package-architecture.md`
- `scripts/new-module-sdk.sh` — cited by
  `platform-service-implementation/README.md`
- `scripts/doppler-init.sh` — cited by `doppler.md`
- `scripts/check-agent-canonicals.sh` — cited by
  `docs/adr/0026-agent-canonical-directory.md`

Report these in the final summary; do NOT auto-delete the citations and do NOT
scaffold the missing scripts.

### 2.5 Post-cleanup shape

`scripts/` should hold 1–3 files (`toggle-jit.mjs` plus optionally the two
untracked files if kept) totaling ~26–36 KB.

---

## Target 3 — `.kiro/` cleanup (~1.3 MB freed)

### 3.1 Delete — empty tree

- `.kiro/reports/backend/` — empty
- `.kiro/reports/backend/phase-0/` — empty sub-dir

### 3.2 Delete — historical audit reports (~1 MB, 74 files)

The Phase-0 → Phase-4 audit reports are outputs from past reviewer runs. No live
doc cites any specific file inside them. Deletion clears `.kiro/reports/` so
Phase-5+ output has a clean home.

- `.kiro/reports/catalog-pass-1/` (8 files, 164 KB)
- `.kiro/reports/phase-0/` (6 files, 268 KB)
- `.kiro/reports/phase-1/` (1 file, 28 KB)
- `.kiro/reports/phase-2/` (9 files, 212 KB)
- `.kiro/reports/phase-3/` (49 files, 320 KB)
- `.kiro/reports/phase-4/` (1 file, 20 KB)

### 3.3 Delete — three shipped-package specs

The corresponding packages already exist in `packages/frontend/`, so these specs
are historical records:

- `.kiro/specs/stackra-config-package/` → `packages/frontend/config/` shipped
- `.kiro/specs/stackra-routing-package/` → `packages/frontend/routing/` shipped
- `.kiro/specs/stackra-dashboard-package/` → `packages/frontend/dashboard/`
  shipped

### 3.4 KEEP — all live infrastructure

Everything else in `.kiro/` is load-bearing. Do NOT touch:

- `.kiro/agents/` — 51 charters (live)
- `.kiro/steering/` — 52 rules (live)
- `.kiro/hooks/` — 6 active hooks
- `.kiro/skeletons/` — 10 templates (see phase-trackers-tasks.md)
- `.kiro/skills/tailwindcss-development/`
- `.kiro/product/` — `agent-personas.md` heavily referenced
- `.kiro/tasks/mobile-native-hardening.md` — in-progress tracker
- `.kiro/specs/` — 7 remaining specs kept (access-approvals,
  backend-frontend-alignment, frontend-domain-rebuild, identity,
  module-blueprints, platform-architecture, platform-service-implementation)

### 3.5 Post-cleanup shape

`.kiro/` should drop from ~3.1 MB to ~1.8 MB.

---

## Execution mechanics

### 4.1 zsh quirks to work around

Two failure modes hit during the original execution — the sub-agent running this
task needs to avoid both:

**Quirk 1 — multi-line commands with `\ && \` chain**

zsh sometimes interprets a phantom leading-space on the continuation line as its
own token, causing `command not found`. Fix: use single-line commands or a
script file.

Broken shape (avoid):

```sh
rm -rf \
  .ref/foo \
  .ref/bar \
  .ref/baz && echo done
```

Working shape:

```sh
rm -rf .ref/foo .ref/bar .ref/baz && echo done
```

**Quirk 2 — stale `ls` after bulk `rm -rf`**

Running `rm -rf <dirs>` then `ls -la <same-dir>` in the same command sometimes
shows the deleted directories as still present due to directory-cache staleness.
Fix: run the delete + verification as separate command invocations.

### 4.2 No `for` loops in tool commands

Per `.kiro/steering/shell-commands.md`: `for` / `while` loops in tool-invoked
shell commands are banned. Every deletion in this file is expressible as a
single `rm -f` / `rm -rf` with space-separated args. No loop needed.

### 4.3 Paths with spaces

Two paths under `.ref/` contain spaces:

- `.ref/webhook copy/`
- `.ref/versioning copy/`
- `.ref/image copy.png`

Quote or single-quote them when passing to `rm`:

```sh
rm -rf '.ref/webhook copy' '.ref/versioning copy'
rm -f '.ref/image copy.png'
```

---

## Execution sequence

Three ordered stages, each atomic:

### Stage 1 — `.ref/` (deletions, big first for fastest freed-space)

```sh
# Big three
rm -rf .ref/done .ref/medusa-develop .ref/api

# Mid-size directories (single command, space-separated)
rm -rf .ref/devtools-main .ref/tenancy-master .ref/tenancy \
  .ref/laravel-modules-master .ref/AI .ref/Laravel-Excel-3.1 \
  .ref/Geography .ref/Geofencing .ref/navigation .ref/import-export \
  .ref/sdk .ref/localization .ref/workflow .ref/settings \
  .ref/versioning .ref/webhook '.ref/webhook copy' '.ref/versioning copy'

# Loose files + images
rm -f .ref/sdui-example.json .ref/sdui-view-edit-example.json \
  .ref/image.png '.ref/image copy.png'

# All .DS_Store recursively
find .ref -name .DS_Store -type f -delete
```

(All commands single-line, no `\` chains — see quirks above.)

### Stage 2 — `scripts/`

```sh
rm -f scripts/promote-wave2a-ulid-prefixes.py \
  scripts/promote-wave2b-ulid-prefixes.py \
  scripts/promote-wave3a-ulid-prefixes.py \
  scripts/promote-wave3bc-ulid-prefixes.py \
  scripts/promote-wave4-wave6-ulid-prefixes.py \
  scripts/promote-wave5-ulid-prefixes.py \
  scripts/promote-wave7-a-ulid-prefixes.py \
  scripts/update-wave1-ulid-prefixes.py \
  scripts/fix-wave1-priorities.py \
  scripts/fix-workspace-terms-wave1.py \
  scripts/normalize-wave1-module-deps.py \
  scripts/rename-tenancy-to-workspaces.py \
  scripts/rename-workspaces-to-tenancy.py \
  scripts/rename-workspaces-to-tenancy-round2.py \
  scripts/fix-tenancy-prose.py \
  scripts/fix-tenants-to-tenancy.py \
  scripts/fix-composer-ns.py \
  scripts/prune-duplicate-migrations.py \
  scripts/migrate-console.mjs \
  scripts/migrate-to-catalog.mjs \
  scripts/strip-stackra-ui.mjs \
  scripts/check-impl-collisions.sh \
  scripts/gen-25-sdks.sh \
  scripts/gen-all-modules.sh \
  scripts/import-real-implementations.sh \
  scripts/smoke-publishables.mjs \
  scripts/verify-package-root.mjs
```

### Stage 3 — `.kiro/`

```sh
# Empty tree
rm -rf .kiro/reports/backend

# Historical audit reports
rm -rf .kiro/reports/catalog-pass-1 .kiro/reports/phase-0 \
  .kiro/reports/phase-1 .kiro/reports/phase-2 .kiro/reports/phase-3 \
  .kiro/reports/phase-4

# Three shipped-package specs
rm -rf .kiro/specs/stackra-config-package \
  .kiro/specs/stackra-routing-package \
  .kiro/specs/stackra-dashboard-package
```

---

## Verify

```sh
# 1. .ref/ post-cleanup size
du -sh .ref/   # → ~6.6 MB (down from ~809 MB)

# 2. .ref/ retained items — exactly 9 top-level entries
ls .ref/ | wc -l   # → ~9

# 3. .ref/ specific kept files/dirs
ls -la .ref/DOMAIN_MODULES_BLUEPRINT.md
ls -d .ref/{packages,schemas,auth,config,config-master,mapped-types-master,vite-config,installer-master}

# 4. .ref/ deleted items are gone
ls -d .ref/{done,medusa-develop,api,devtools-main,tenancy-master} 2>&1 | \
  grep -v 'No such' && echo 'FAIL: deletions incomplete'

# 5. scripts/ retained
ls scripts/toggle-jit.mjs
du -sh scripts/   # → ~26–36 KB (was 240 KB)

# 6. scripts/ deletions confirmed
ls scripts/promote-*.py scripts/fix-*.py scripts/rename-*.py \
  scripts/migrate-*.mjs 2>&1 | grep -v 'No such' && echo 'FAIL: script deletions incomplete'

# 7. .kiro/ post-cleanup size
du -sh .kiro/   # → ~1.8 MB (was ~3.1 MB)

# 8. .kiro/ deleted dirs are gone
ls -d .kiro/reports/phase-0 .kiro/reports/backend \
  .kiro/specs/stackra-config-package \
  .kiro/specs/stackra-routing-package \
  .kiro/specs/stackra-dashboard-package 2>&1 | grep -v 'No such' && \
  echo 'FAIL: .kiro deletions incomplete'

# 9. .kiro/ live infrastructure intact
ls .kiro/agents/README.md \
  .kiro/steering/architecture.md \
  .kiro/product/agent-personas.md \
  .kiro/skeletons/README.md 2>&1 | head
```

---

## Follow-up items to report (not deletions)

The sub-agent's final report should surface these:

1. **Two untracked scripts** were kept pending user decision:
   `list-blueprint-only-modules.sh`, `survey-modules.py`.
2. **Broken steering references** — 5 scripts named but never authored; affects
   `.kiro/steering/module-graph.md`, `priority-ordering.md`,
   `ulid-prefix-registry.md`, `package-architecture.md`, `doppler.md`, and
   `docs/adr/0026-agent-canonical-directory.md`.
3. **`.ref/packages/i18n/`** is cited by `.kiro/agents/translator.md` but
   doesn't exist. Broken reference to fix in translator.md.
4. **Two `-master` reference dirs** (`.ref/config-master/`,
   `.ref/mapped-types-master/`) were consumed only by the three shipped-package
   specs deleted in §3.3. If nothing else consumes them, a follow-up sweep can
   delete both.

---

## Source of truth

`fullplan.md` — search for "cleanup", "809MB", "813MB", ".ref/", "scripts/",
"toggle-jit.mjs", "reports/phase-", "stackra-config-package", "webhook copy",
"zsh quirk". Every specific number, filename, and KEEP/DELETE decision is
already fixed there.
