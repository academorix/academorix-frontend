# ADR 0026 — Agent canonical directory model

**Status:** Accepted **Date:** 2026-07-20 **Deciders:** Chief Orchestrator +
Docs Lead + Delivery Lead

## Context

Academorix spans three source repositories today (`academorix-frontend`,
`academorix-backend`, `academorix-ai-service`) and will grow to four when the
mobile app spins out of `academorix-frontend/apps/react-native-template` into
its own repo. Every repo has some overlap with the shared 51-agent roster
described in `AGENT_ROSTER.md`. Concretely, the same agent file exists (or needs
to exist) in more than one place today:

- `academorix-frontend/.kiro/agents/laravel-feature-builder.md` — reference copy
  referring to the sibling backend repo.
- `academorix-backend/.kiro/agents/laravel-feature-builder.md` — the
  authoritative copy for the backend lane.
- `.ref/agents/*.md` (git-ignored, per-workspace notes).

If we do nothing, three failure modes are inevitable:

1. **Drift.** A charter change lands in one repo, not the other. Two months
   later, two supervisors read two slightly different charters and give the same
   builder contradictory instructions.
2. **Duplication of steering.** Every repo carries a full copy of the
   `.kiro/steering/*.md` set that its agents reference. Steering rules change;
   only some repos update.
3. **Onboarding fragmentation.** A new supervisor cannot know which repo has the
   true charter for a shared agent. We waste twenty minutes per onboarded
   engineer forever.

The pattern shared by every mature monorepo of monorepos (`nx`, `bazel`,
Nx-in-Google, Meta's Buck2 layout, GitHub's Hydro) is the same: hoist truly-
shared assets one level up and symlink from the leaves. Any leaf that diverges
consciously does so via an explicit override, not by silent copy- paste-drift.

## Options considered

1. **Every repo carries its own copy of every agent charter (status quo —
   rejected).** Failure modes 1 + 2 + 3 above. Also: cross-repo agents like
   `product-lead` have no natural home, so they end up in whichever repo invoked
   them first, which is an accident.
2. **One repo owns every charter, others `curl` at build time (rejected).**
   Runtime coupling to a network fetch. Fragile in offline dev. Version- skew
   risk when a leaf repo needs a specific charter version.
3. **git submodule (rejected).** Submodules solve version pinning but introduce
   their own onboarding tax (every clone needs `--recursive`), and Kiro's tool
   layer does not follow submodule boundaries cleanly for `.kiro/agents/`
   discovery.
4. **A parent workspace (`academorix/`) with per-repo children + symlinks
   (chosen).** The parent workspace holds the truly-cross-repo assets; each leaf
   carries its repo-specific charters plus symlinks to the parent for the shared
   ones. The `.ref/agents/` folder becomes purely informational (git-ignored)
   and never authoritative.

## Decision

Adopt a **three-tier canonical directory model** for agent charters, personas,
steering, and ADRs:

### Tier 1 — Parent workspace (`academorix/`)

Truly cross-repo assets live in `academorix/` (the parent of every leaf repo).
Each leaf symlinks into it:

```
academorix/                             ← parent workspace (new)
├── .kiro/
│   ├── agents/                         ← cross-repo charters
│   ├── product/agent-personas.md       ← the dossier
│   └── steering/                       ← cross-repo steering
├── AGENT_ROSTER.md                     ← the master plan
├── AGENT_QUICKSTART.md
├── docs/adr/                           ← cross-repo ADRs (including this one)
├── academorix-frontend/                ← leaf 1
├── academorix-backend/                 ← leaf 2
└── academorix-ai-service/              ← leaf 3
```

**Which agents live in Tier 1** (cross-repo, symlinked from every leaf):

- All eight leadership charters (`chief-orchestrator`, `product-lead`,
  `design-lead`, `delivery-lead`, `quality-lead`, `security-lead`, `data-lead`,
  `docs-lead`).
- Every discovery + design agent (`spec-intake-analyst`, `solution-architect`,
  `api-contract-designer`, `data-modeler`, `threat-modeler`, `product-designer`,
  `content-designer`).
- Every ship + operate agent (`release-manager`, `deploy-engineer`, `sre-lead`,
  `observability-engineer`, `incident-commander`, `analytics-engineer`,
  `support-liaison`, `legal-compliance-officer`).
- Every docs steward (`docs-adr-steward`, `docs-changesets-steward`,
  `translator`).
- Every security reviewer (`security-compliance-reviewer`, `threat-modeler`).
- Every cross-cutting reviewer (`workspace-standardization-steward`,
  `standards-steward`).

### Tier 2 — Repo-specific (`<repo>/.kiro/agents/`)

Agents that only make sense inside one repo stay local:

- `academorix-frontend/.kiro/agents/`: `heroui-ui-builder`,
  `framework-core-builder`, `heroui-native-builder`, `code-standards-steward`,
  `code-documentation-writer`, `support-utilities-steward`,
  `vitest-test-engineer`, `native-test-engineer`,
  `package-api-release-reviewer`, `container-di-architecture-reviewer`,
  `ui-design-a11y-reviewer`.
- `academorix-backend/.kiro/agents/`: `laravel-feature-builder`,
  `codebase-housekeeper`, `tenancy-compliance-auditor`,
  `test-mutation-engineer`, `backend-architecture-reviewer`,
  `backend-platform-reviewer`.
- `academorix-ai-service/.kiro/agents/`: `python-service-builder`,
  `mlops-reviewer`, `data-scientist-reviewer`.

### Tier 3 — Reference-only (`.ref/agents/`)

Every leaf carries a `.ref/agents/` folder that is git-ignored. This is scratch
space for supervisors and for offline reading of the parent's charters when the
symlink is not yet established. **Nothing in `.ref/` is authoritative.** A
charter change to `.ref/` is a no-op.

## Consequences

**Positive:**

- **Single source of truth per shared charter.** A change to `product-lead`
  lands once in `academorix/.kiro/agents/product-lead.md` and is visible in
  every leaf via the symlink.
- **Steering rules stay in sync.** `academorix/.kiro/steering/*.md` is the
  canonical set; leaves symlink.
- **AGENT_ROSTER.md is one file.** Every leaf reads the same roster.
- **Onboarding is one command.** Cloning any leaf pulls the parent (or the setup
  script bootstraps it), and every charter is resolvable.

**Negative:**

- **Bootstrap overhead.** Setting up the parent workspace + symlinks is a
  one-time cost across every developer's machine. Setup script mitigates. CI
  runners follow the same script.
- **Windows symlink caveats.** Windows requires developer-mode enabled or admin
  privileges for symlinks. Every non-Windows developer is fine; Windows
  developers set developer-mode once. WSL2 developers are fine.
- **Git submodules cannot pin the parent from a leaf.** We accept this; the
  parent is a plain sibling directory, not a submodule.

**Neutral:**

- **`.ref/agents/` becomes information-only.** Existing content stays as
  scratch; no cleanup required. New scratch material also goes here.

## Migration plan

Migration runs in three passes over a two-week window. Rollback at any pass is a
one-file revert.

**Pass 1 (Day 1–3): Establish the parent + move Tier 1 charters.**

- Create `academorix/` as a sibling of the existing leaf repos.
- Move Tier 1 charters from `academorix-frontend/.kiro/agents/` (where they
  exist today) into `academorix/.kiro/agents/`.
- Replace the moved files with relative symlinks pointing at
  `../../../academorix/.kiro/agents/<slug>.md`.
- Same move for `academorix/.kiro/product/agent-personas.md` (leaves keep the
  symlink at `.kiro/product/agent-personas.md`).
- Same move for `academorix/AGENT_ROSTER.md` (leaves symlink at
  `AGENT_ROSTER.md` at their root).
- Same move for `academorix/docs/adr/*.md` for cross-cutting ADRs (this file
  0026 lives in `academorix/docs/adr/`).

**Pass 2 (Day 4–7): Sync steering.**

- Move `academorix-frontend/.kiro/steering/*.md` into
  `academorix/.kiro/steering/`.
- Replace with symlinks per file.
- Sanity-check the `Included Steering` hook in `.kiro/hooks/`.

**Pass 3 (Day 8–14): Set up backend + AI-service leaves.**

- Repeat Pass 1 + Pass 2 in `academorix-backend/` and `academorix-ai-service/`.
- Verify `invoke_sub_agent(name: "<slug>")` still resolves in every leaf.

## Rollout timeline

- **Day 0** (today): ADR-0026 lands.
- **Day 3**: Pass 1 complete in the frontend.
- **Day 7**: Pass 2 complete in the frontend.
- **Day 14**: Pass 3 complete across all leaves.
- **Day 21**: Retirement of any straggler references in `.ref/agents/`.

## Reversibility

At any point:

- **Revert a symlink to a full copy** by `readlink` + `cp` + delete the symlink.
  One-file operation per revert.
- **Revert the parent workspace entirely** by `cp -R` from parent back to the
  frontend leaf (and each other leaf), then delete the parent.
- No data loss: symlinks always resolve to a real file; if the file is moved
  back to the leaf, the symlink can be replaced with the file content
  one-for-one.

## Alternatives considered

- **Every repo copies charters (status quo).** Rejected — drift.
- **One repo owns, others `curl` at build time.** Rejected — network coupling,
  offline-dev pain.
- **git submodule per shared asset.** Rejected — clone tax + Kiro's tool layer
  does not follow submodule boundaries cleanly.
- **Monorepo (all repos into one).** Rejected — the backend + AI service have
  different language + tool stacks that do not benefit from a single-repo
  lifecycle. Backend Composer + Turborepo + PHP CI runs at a different cadence
  than frontend pnpm + Turborepo + TypeScript CI.

## References

- `AGENT_ROSTER.md` — the master roster this ADR governs.
- `.kiro/agents/README.md` — the agent directory this ADR shapes.
- `.kiro/product/agent-personas.md` — the dossier that maps 1:1 to the Tier 1 +
  Tier 2 slugs.
- `AGENT_ROSTER.md §I.5` — the cross-repo canonical-directory pointer to this
  ADR.
- `.kiro/agents/README.md §Cross-repo strategy` — the operational summary this
  ADR authorises.
