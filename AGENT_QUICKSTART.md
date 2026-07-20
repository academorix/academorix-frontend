---
title: Agent Quickstart — Day-1 Playbook
audience: humans + orchestrators
sibling_docs:
  - AGENT_ROSTER.md
  - .kiro/agents/README.md
  - tasks-intake-discovery-definition.md
  - tasks-design-pipeline.md
  - tasks-frontend-orchestration.md
  - tasks-backend-orchestration.md
  - tasks-ship-and-operate.md
---

# Agent Quickstart — Day-1 Playbook

Six recipes for turning ambient input into a shipping product using the
Academorix agent stack. Every recipe is a copy-paste block a human or an
orchestrator agent can run.

## When to read this vs `AGENT_ROSTER.md`

- **`AGENT_ROSTER.md`** — the reference: which agents exist, what phases they
  own, how the org is shaped. Read this once. Reference on demand.
- **`AGENT_QUICKSTART.md` (this file)** — the recipes: exactly what to type
  to move a specific piece of work forward. Read this every time you kick
  off a new feature or release.

## Recipes

- [Recipe 0 — Bootstrap a new workspace with `academorix new`](#recipe-0--bootstrap-a-new-workspace-day--1)
- [Recipe 1 — Intake a PDF and emit a project blueprint](#recipe-1--intake-a-pdf-day-0)
- [Recipe 2 — Turn a brief into a PRD + INVEST stories](#recipe-2--brief--prd-day-1-3)
- [Recipe 3 — Design phase (5 specialists in rounds)](#recipe-3--design-phase-day-4-7)
- [Recipe 4 — Build phase (fan out to lanes)](#recipe-4--build-phase-day-8-20)
- [Recipe 5 — Ship + Operate](#recipe-5--ship--operate-day-26)

---

## Recipe 0 — Bootstrap a new workspace (Day -1)

**Goal:** Turn `academorix new my-project` into a running workspace with
frontend + backend + native templates wired up.

**Duration:** 10 minutes.

**Prerequisites**

- [ ] Composer 2.x installed (`composer --version`)
- [ ] Node 22+ installed (`node --version`)
- [ ] pnpm 10+ installed (`pnpm --version`)
- [ ] Doppler CLI installed (`doppler --version`)
- [ ] HeroUI Pro authenticated (`pnpm heroui:status`)

### Steps

**1. Install the CLI.** Two options:

Global (recommended once the CLI is published):
```sh
composer global require academorix/cli
```

Workspace-local (works today, from inside this monorepo):
```sh
pnpm --filter tools/cli exec ./bin/academorix --version
# Or:
cd tools/cli && ./bin/academorix --version
```

**2. Create the workspace.**
```sh
academorix new my-project
```

This clones the three templates (`apps/laravel-template`, `apps/vite-template`,
`apps/react-native-template`), wires up `.doppler.yaml`, installs the config
packages, and produces a workspace ready to run.

**3. Authenticate Doppler for the new workspace.**
```sh
cd my-project
doppler login                  # if not already
doppler setup --no-interactive # picks up the root `.doppler.yaml`
```

### Outputs

- `my-project/apps/{laravel-template,vite-template,react-native-template}/`
- `my-project/.doppler.yaml` (root)
- `my-project/packages/config/{eslint,prettier,tsconfig,tsup}/` (shared)

### Handoff

Feature work starts with [Recipe 1](#recipe-1--intake-a-pdf-day-0).

---

## Recipe 1 — Intake a PDF (Day 0)

**Goal:** Turn a raw customer brief (PDF, DOCX, MD) into the four structured
Phase 0 artefacts.

**Duration:** 2-4 hours.

**Prerequisites**

- [ ] Feature has a kebab-case slug decided (e.g. `family-payment-plans`)
- [ ] Raw brief exists at `.kiro/product/intake/raw/<slug>/BRD.md` (or `.pdf`)
- [ ] Reference blueprint exists at `.ref/DOMAIN_MODULES_BLUEPRINT.md`

### Steps

**1. Add a feature block to `tasks-intake-discovery-definition.md`.**

Copy the **Per-feature template** from the tracker into the **Current features
in flight** section. Fill in slug + origin + raw source path.

**2. Invoke `spec-intake-analyst`.**

```
invoke_sub_agent(
  name: 'spec-intake-analyst',
  prompt: 'Read `.kiro/product/intake/raw/<slug>/BRD.md` and emit the four
           Phase 0 files under `.kiro/product/intake/<slug>/`. Match the
           domain-modules blueprint shape at
           `.ref/DOMAIN_MODULES_BLUEPRINT.md`.',
  contextFiles: [
    { path: '.kiro/product/intake/raw/<slug>/BRD.md' },
    { path: '.ref/DOMAIN_MODULES_BLUEPRINT.md' }
  ],
)
```

**3. Verify outputs.** All four files should exist:
```sh
ls .kiro/product/intake/<slug>/
# → brief.md
# → blueprint-draft.md
# → assumptions.md
# → reading-list.md
```

**4. Flip Phase 0 checkboxes** in `tasks-intake-discovery-definition.md`.
Log the transition.

### Outputs

- `.kiro/product/intake/<slug>/brief.md`
- `.kiro/product/intake/<slug>/blueprint-draft.md`
- `.kiro/product/intake/<slug>/assumptions.md`
- `.kiro/product/intake/<slug>/reading-list.md`

### Handoff

Proceed to [Recipe 2](#recipe-2--brief--prd-day-1-3) for Phase 1-2 discovery
and definition.

---

## Recipe 2 — Brief → PRD (Day 1-3)

**Goal:** Turn the Phase 0 intake into personas + JTBD + competitive matrix +
opportunity brief (Phase 1) and a PRD with INVEST stories + scope commitments
(Phase 2).

**Duration:** 1-3 days.

**Prerequisites**

- [ ] [Recipe 1](#recipe-1--intake-a-pdf-day-0) complete
- [ ] Business-type decision made (Academy / Salon / Gym / Clinic / mixed)

### Steps

**1. Invoke `product-lead`** to orchestrate Phase 1 discovery.

```
invoke_sub_agent(
  name: 'product-lead',
  prompt: 'Feature <slug> has cleared Phase 0. Orchestrate Phase 1
           discovery: personas, JTBD map, competitive matrix, opportunity
           brief. Log each artefact.',
  contextFiles: [
    { path: '.kiro/product/intake/<slug>/brief.md' },
    { path: '.kiro/product/intake/<slug>/blueprint-draft.md' },
    { path: '.kiro/product/intake/<slug>/assumptions.md' }
  ],
)
```

**2. Verify Phase 1 outputs.** `product-lead` will have produced:
```sh
ls .kiro/product/intake/<slug>/
# → personas.md
# → jtbd.md
# → competitive-matrix.md
# → opportunity-brief.md
```

Flip Phase 1 checkboxes.

**3. Invoke `academorix-product`** to write the PRD.

```
invoke_sub_agent(
  name: 'academorix-product',
  prompt: 'Feature <slug> has cleared Phase 1 discovery. Write the Phase 2
           PRD at `.kiro/product/prds/<slug>.md` with INVEST stories,
           v1/v2/later scope, and business-type surface strategy.',
  contextFiles: [
    { path: '.kiro/product/intake/<slug>/brief.md' },
    { path: '.kiro/product/intake/<slug>/personas.md' },
    { path: '.kiro/product/intake/<slug>/jtbd.md' },
    { path: '.kiro/product/intake/<slug>/opportunity-brief.md' }
  ],
)
```

**4. Verify PRD.** Every INVEST story is independent, negotiable, valuable,
estimable, small, testable. Scope is split into Now / Next / Later with no
ambiguity.

Flip Phase 2 checkboxes.

### Outputs

- `.kiro/product/intake/<slug>/personas.md`
- `.kiro/product/intake/<slug>/jtbd.md`
- `.kiro/product/intake/<slug>/competitive-matrix.md`
- `.kiro/product/intake/<slug>/opportunity-brief.md`
- `.kiro/product/prds/<slug>.md`

### Handoff

Add a feature block to `tasks-design-pipeline.md` and proceed to
[Recipe 3](#recipe-3--design-phase-day-4-7).

---

## Recipe 3 — Design phase (Day 4-7)

**Goal:** Turn a PRD into a build-ready design package: ADR + ERD + OpenAPI
+ threat model + screen contracts. Five specialists coordinated in four
rounds.

**Duration:** 3-4 days.

**Prerequisites**

- [ ] [Recipe 2](#recipe-2--brief--prd-day-1-3) complete — PRD signed off
- [ ] Feature block added to `tasks-design-pipeline.md`

### Steps

**1. Invoke `design-lead`** to walk the four rounds.

```
invoke_sub_agent(
  name: 'design-lead',
  prompt: 'Feature <slug> has cleared Phase 2. Orchestrate the four Phase 3
           rounds per `tasks-design-pipeline.md`. Round 1 fires
           solution-architect + data-modeler in parallel; Round 2 fires
           api-contract-designer + threat-modeler; Round 3 fires
           product-designer; Round 4 fires docs-adr-steward to formalise.
           Report done when every Go/no-go criterion is green.',
  contextFiles: [
    { path: 'tasks-design-pipeline.md' },
    { path: '.kiro/product/prds/<slug>.md' }
  ],
)
```

**2. Track rounds** in `tasks-design-pipeline.md` — flip checkboxes as each
specialist reports done. Every round must be fully green before the next
opens.

**3. Verify Go/no-go criteria** per the tracker before Phase 4 handoff.

### Outputs

- `docs/adr/00XX-<slug>-architecture.md` (status: accepted)
- `docs/erd/<slug>.md` + migration plan
- `docs/contracts/<slug>-request.schema.json`
- `docs/contracts/<slug>-response.schema.json`
- `docs/security/threat-models/<slug>.md`
- `.kiro/product/designs/<slug>/` (screen contracts, IA, flows)

### Handoff

Add feature blocks to `tasks-frontend-orchestration.md` and
`tasks-backend-orchestration.md` and proceed to
[Recipe 4](#recipe-4--build-phase-day-8-20).

---

## Recipe 4 — Build phase (Day 8-20)

**Goal:** Turn a design package into working code across every build lane
(backend, frontend web, frontend native, AI service). Continuous cross-cutting
work (standards, docs, tests) runs alongside.

**Duration:** 8-15 days.

**Prerequisites**

- [ ] [Recipe 3](#recipe-3--design-phase-day-4-7) complete — Phase 3 Go/no-go
      green
- [ ] Feature blocks in both `tasks-frontend-orchestration.md` and
      `tasks-backend-orchestration.md`

### Steps

**1. Invoke `delivery-lead`** to fan out to the build lanes.

```
invoke_sub_agent(
  name: 'delivery-lead',
  prompt: 'Feature <slug> has cleared Phase 3. Orchestrate Phase 4 fan-out:
           laravel-feature-builder (backend), framework-core-builder +
           heroui-ui-builder (frontend web), heroui-native-builder
           (frontend native), python-service-builder (AI service — if in
           scope). Standards + docs stewards run continuously alongside.',
  contextFiles: [
    { path: 'tasks-frontend-orchestration.md' },
    { path: 'tasks-backend-orchestration.md' },
    { path: 'docs/adr/00XX-<slug>-architecture.md' }
  ],
)
```

**2. Standards + docs run continuously.** `delivery-lead` invokes:
- `code-standards-steward` — sweeps for new violations as code lands
- `code-documentation-writer` — writes docblocks as each module ships
- `support-utilities-steward` — migrates native calls to `@stackra/support`
- `translator` — scaffolds `en/ar` i18n catalogs for user-facing strings
- `workspace-standardization-steward` — normalises manifests / configs
- `docs-adr-steward` — updates ADRs if design decisions shift
- `docs-changesets-steward` — writes changesets as each package changes

**3. Tests land as code lands.** `vitest-test-engineer` (frontend web),
`test-mutation-engineer` (backend), `native-test-engineer` (frontend native)
write and improve tests continuously.

**4. Phase 5 begins** when every Phase 4 checkbox flips green.
`quality-lead` orchestrates the parallel reviewer sweep:
- `backend-architecture-reviewer`
- `backend-platform-reviewer`
- `security-compliance-reviewer`
- `standards-steward`
- `tenancy-compliance-auditor`
- `container-di-architecture-reviewer`
- `package-api-release-reviewer`
- `ui-design-a11y-reviewer`
- `native-design-a11y-reviewer`
- `native-platform-reviewer`
- `data-scientist-reviewer` (AI-scoped)
- `mlops-reviewer` (AI-scoped)
- `e2e-test-engineer` (new — Phase 5 specialist)
- `performance-engineer` (new — Phase 5 specialist)
- `accessibility-audit-lead` (new — Phase 5 specialist)

Every finding lands with a P0/P1/P2/P3 severity. `quality-lead` holds the
gate: release ships only on green.

### Outputs

- Working code in every lane's `packages/**` / `apps/**` scope
- Passing tests: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`
- Changeset files under `.changeset/`
- Reviewer findings resolved

### Handoff

Feature ready for release. Proceed to
[Recipe 5](#recipe-5--ship--operate-day-26).

---

## Recipe 5 — Ship + Operate (Day 26+)

**Goal:** Package the feature into a release, deploy it, observe it, and
carry it forward as an operated service.

**Duration:** 2-5 days for Phase 6; Phase 7 is continuous.

**Prerequisites**

- [ ] [Recipe 4](#recipe-4--build-phase-day-8-20) complete
- [ ] Every Phase 5 reviewer artefact green
- [ ] `quality-lead` sign-off on the Phase 5 gate

### Steps

**1. Invoke `release-manager`** to cut the release.

```
invoke_sub_agent(
  name: 'release-manager',
  prompt: 'Features <slugs> cleared Phase 5. Cut release vX.Y.Z:
           consolidate changesets, bump versions, draft release notes per
           `.kiro/skeletons/release-pr.md`, cut the tag, hand off to
           deploy-engineer for canary + promote. Update
           tasks-ship-and-operate.md.',
  contextFiles: [
    { path: 'tasks-frontend-orchestration.md' },
    { path: 'tasks-backend-orchestration.md' },
    { path: '.kiro/skeletons/release-pr.md' },
    { path: 'tasks-ship-and-operate.md' }
  ],
)
```

**2. Invoke `deploy-engineer`** for canary + promote.

```
invoke_sub_agent(
  name: 'deploy-engineer',
  prompt: 'Deploy release vX.Y.Z to canary. Observe error rate + latency +
           saturation for <N> hours. Promote to full deploy on green, roll
           back on red. Update tasks-ship-and-operate.md.',
  contextFiles: [
    { path: 'tasks-ship-and-operate.md' },
    { path: 'docs/runbooks/<service>.md' }
  ],
)
```

**3. Invoke `sre-lead`** to walk Phase 7 checklist for any new service.

```
invoke_sub_agent(
  name: 'sre-lead',
  prompt: 'Service <service-name> is live from release vX.Y.Z. Walk the
           Phase 7 checklist: define SLI, agree SLO, wire alerts, publish
           runbook per `.kiro/skeletons/runbook.md`, configure observability
           per the skeletons under `.kiro/skeletons/`, schedule DR drill.',
  contextFiles: [
    { path: 'tasks-ship-and-operate.md' },
    { path: '.kiro/skeletons/runbook.md' },
    { path: '.kiro/skeletons/sentry-project.yaml' },
    { path: '.kiro/skeletons/grafana-dashboard.json' }
  ],
)
```

### Outputs

- Tagged release on `main` (`vX.Y.Z`)
- Release PR merged, CHANGELOG updated
- Canary deployed + promoted (or rolled back)
- SLI/SLO defined + alerts wired
- Runbook committed
- Sentry + Grafana + PagerDuty configured

### Handoff

Feature is in service. Phase 7 is continuous — the `sre-lead` +
`observability-engineer` + `incident-commander` trio watches the SLO burn,
files post-mortems on incidents, and refreshes the runbook as new failure
modes are discovered.

---

## Common pitfalls

**1. Phase skipping.** Jumping from Phase 0 to Phase 3 because "the design
looks obvious" ships fragile foundations. Every phase produces artefacts the
next phase consumes; if Phase 2 hasn't produced a PRD, Phase 3 has nothing
concrete to design against and will drift.

**2. Round skipping in Phase 3.** Firing all five design specialists at once
guarantees collision — `product-designer` needs `api-contract-designer`'s
vocabulary, which needs `solution-architect`'s ADR. The rounds exist to make
parallelism safe, not slow.

**3. Ignoring Phase 7.** Shipping a feature without wiring SLIs, alerts, and
a runbook means the first real incident is a scramble. Every service the
workspace runs gets a Phase 7 block on Day 1 — no exceptions.

## Cheat sheet

| Task                             | Command                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Bootstrap a workspace            | `academorix new my-project`                                                   |
| Kick off a feature intake        | Copy Per-feature template into `tasks-intake-discovery-definition.md`         |
| Fire Phase 0                     | `invoke_sub_agent(name: 'spec-intake-analyst', ...)`                          |
| Fire Phase 1-2                   | `invoke_sub_agent(name: 'product-lead', ...)`                                 |
| Fire Phase 3                     | `invoke_sub_agent(name: 'design-lead', ...)`                                  |
| Fire Phase 4                     | `invoke_sub_agent(name: 'delivery-lead', ...)`                                |
| Fire Phase 5                     | `invoke_sub_agent(name: 'quality-lead', ...)`                                 |
| Fire Phase 6                     | `invoke_sub_agent(name: 'release-manager', ...)`                              |
| Fire Phase 7                     | `invoke_sub_agent(name: 'sre-lead', ...)`                                     |
| Check pipeline status            | Read the six task-*.md trackers at repo root                                  |
| Find the runbook shape           | `.kiro/skeletons/runbook.md`                                                  |
| Find the ADR shape               | `.kiro/skeletons/adr.md`                                                      |
| Find the release-PR shape        | `.kiro/skeletons/release-pr.md`                                               |

## Changelog

*(no entries yet)*
