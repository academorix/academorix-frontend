# Tasks — Master Index

Recreation plan for all pre-workspace.md work from `fullplan.md`. This master
file is an index and parallelization graph. Each sub-file below is a
self-contained task list a sub-agent can execute independently.

**Excluded from every task file below**: everything from `workspace.md` — the
config extraction batches A/B/C/D/E (`@academorix/config-tsup`,
`@academorix/config-tsconfig`, `@academorix/config-prettier`), root file
hardening (`turbo.json`, `.gitignore`, `playwright.config.ts`, `.npmrc`,
`.nvmrc`, `commitlint.config.mjs`, `.lintstagedrc.mjs`, `.size-limit.json`,
`knip.json`, root `package.json`), strict-TS re-enable (`noImplicitOverride`,
`noUncheckedIndexedAccess`), console lint sweep (77 errors in
`@stackra/console`), `RnExample` ESLint 9 flat-config migration, and the
`@stackra/notifications` heroui-native-pro `EmptyState`/`Badge` fix.

**No git operations anywhere**. No `git stash`, no `git commit`, no `git push`,
no branch creation. If a task suggests one, ignore it.

---

## File map

| File                      | Concern                                              | Scope                                     | Depends on                                       |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| `agents-tasks.md`         | Agent roster + personas + hooks + ADR-0026           | ~3,600 lines across ~25 files             | none                                             |
| `cli-tasks.md`            | Symfony Console CLI at `tools/cli/`                  | 57 files, ~7,689 lines PHP                | `omniterm-tasks.md` for `pdphilip/omniterm ^3.0` |
| `catalog-tasks.md`        | Schema publishing + 156 catalog.json + tier taxonomy | ~160 files                                | `structure-tasks.md` (new paths)                 |
| `stubs-tasks.md`          | 69 template stubs + StubRegistry wiring              | 69 stub files + registry edits            | `cli-tasks.md` (registry lives in CLI)           |
| `structure-tasks.md`      | Package reorganization                               | move `backend-packages/**` + `packages/*` | none                                             |
| `templates-tasks.md`      | Apps template standardization + Doppler              | ~15 files across 3 templates              | none                                             |
| `cleanup-tasks.md`        | `.ref/`, `scripts/`, `.kiro/` cleanup                | ~813 MB freed                             | none                                             |
| `phase-trackers-tasks.md` | Phase 0-7 trackers + AGENT_QUICKSTART + skeletons    | ~15 files                                 | `agents-tasks.md`                                |
| `omniterm-tasks.md`       | pdphilip/omniterm v3 integration                     | trait + wrapper + view bootstrap          | none                                             |

---

## Parallelization graph

The nine sub-files split into three waves. Everything in a wave can run in
parallel; waves themselves are ordered because later waves consume earlier
outputs.

```
Wave 1 (fully independent — fire all in parallel):
  ├── structure-tasks.md      ← must land first if catalog/stubs writes into new tree
  ├── cleanup-tasks.md
  ├── templates-tasks.md
  ├── omniterm-tasks.md
  └── agents-tasks.md

Wave 2 (needs Wave 1 output):
  ├── cli-tasks.md            ← writes into tools/cli/; consumes omniterm-tasks
  └── phase-trackers-tasks.md ← consumes agents-tasks

Wave 3 (needs Wave 2 output):
  ├── catalog-tasks.md        ← writes into packages/backend/** + packages/frontend/**
  └── stubs-tasks.md          ← writes into tools/cli/src/Stubs/
```

Sub-agents fired for Wave 1 need zero coordination. Sub-agents fired for Wave 2
read the outputs of Wave 1 (`packages/backend/**` and `packages/frontend/**`
must exist). Sub-agents fired for Wave 3 write INTO the trees from Wave 2 and
the CLI from Wave 2, so they must wait.

---

## Concurrency safety

Every sub-file writes to a **disjoint file tree**. No two files ever touch the
same path. That's the invariant. If a sub-agent finds itself editing a file
another sub-file owns, that's a bug in the plan — fix the plan, don't overwrite.

| Sub-file                | Owns                                                                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| agents-tasks.md         | `AGENT_ROSTER.md`, `.kiro/agents/**`, `.kiro/product/agent-personas.md`, `.kiro/hooks/**`, `docs/adr/0026-agent-canonical-directory.md`                                                                                                  |
| cli-tasks.md            | `tools/cli/**` (except stubs)                                                                                                                                                                                                            |
| catalog-tasks.md        | `.ref/schemas/catalog.v1.json`, `docs/backend-package-tiers.md`, every `catalog.json` under `packages/**`, `scripts/add-catalog-schema.py`                                                                                               |
| stubs-tasks.md          | `tools/cli/src/Stubs/stubs/**`, `tools/cli/src/Stubs/StubRegistry.php`                                                                                                                                                                   |
| structure-tasks.md      | `pnpm-workspace.yaml`, `scripts/fix-workspace-relative-paths.py`, every `tsconfig.json` + `tsup.config.ts` + `package.json` under `packages/**` (extends-path updates only)                                                              |
| templates-tasks.md      | `apps/**` (all three template directories), root `.doppler.yaml`, root `package.json` doppler helpers ONLY                                                                                                                               |
| cleanup-tasks.md        | delete-only in `.ref/`, `scripts/`, `.kiro/reports/`, `.kiro/specs/{stackra-config-package,stackra-routing-package,stackra-dashboard-package}/`                                                                                          |
| phase-trackers-tasks.md | root `tasks-intake-discovery-definition.md`, `tasks-design-pipeline.md`, `tasks-ship-and-operate.md`, `AGENT_QUICKSTART.md`, `.kiro/skeletons/**`                                                                                        |
| omniterm-tasks.md       | `tools/cli/src/Bootstrap/**`, `tools/cli/src/helpers.php`, `tools/cli/src/Concerns/UsesOmniTerm.php`, `backend-packages/framework/console/src/Concerns/UsesOmniTerm.php`, `backend-packages/framework/console/src/Concerns/OmniTerm.php` |

If a sub-file needs to READ from another sub-file's tree that's expected — read
is fine, write is the collision.

---

## Verification checkpoints

Each sub-file ends with a `## Verify` block listing the exact commands a
sub-agent runs to confirm its work landed. The master file's verification is the
concatenation:

```sh
# After Wave 1 lands
ls -la AGENT_ROSTER.md .kiro/agents/README.md .doppler.yaml
find packages/backend -maxdepth 3 -name composer.json | wc -l   # → ~143
find packages/frontend -maxdepth 2 -name package.json | wc -l    # → ~50

# After Wave 2 lands
./tools/cli/bin/academorix --version   # → Academorix CLI 0.1.0

# After Wave 3 lands
find packages -name catalog.json | wc -l   # → 155 or 156
ls tools/cli/src/Stubs/stubs/ | wc -l      # → 6 (php/react/native/typescript/config/docs)
```

---

## Source of truth

Every content spec below traces back to
`/Users/akouta/Projects/academorix-frontend/fullplan.md`. When the sub-file
leaves a detail unspecified, the sub-agent consults `fullplan.md` — do NOT
invent shape.
