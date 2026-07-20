# Phase Trackers Tasks

Author the four phase trackers at workspace root + the Day-1 quickstart

- 10 substrate skeletons under `.kiro/skeletons/`.

**File-tree ownership**:

- Root `tasks-intake-discovery-definition.md`
- Root `tasks-design-pipeline.md`
- Root `tasks-ship-and-operate.md`
- Root `AGENT_QUICKSTART.md`
- `.kiro/skeletons/**` (10 template files)

**Depends on**: `agents-tasks.md` — the trackers reference agents by slug and
rely on `AGENT_ROSTER.md` existing.

**No git operations.**

---

## Existing trackers (already at workspace root)

Two Phase-4/5 rehab trackers ship in the workspace:

- `tasks-frontend-orchestration.md` — Phase 4/5 frontend package rehab audit
  (Phase 0-4 baseline reviews, package-by-package standards sweep)
- `tasks-backend-orchestration.md` — Phase 4/5 backend package rehab audit

**Do NOT recreate these.** They're the pre-existing trackers this file extends
around. This task adds the missing Phase 0-3 + Phase 6-7 trackers to sit
alongside them.

---

## 1. `tasks-intake-discovery-definition.md`

Phase 0-2 tracker (~186 lines). Covers Day-0 → Day-3 for a new feature.

### Frontmatter

```yaml
---
title: Tasks — Intake, Discovery, Definition (Phase 0-2)
status: active
phase_start: 0
phase_end: 2
duration_target: Day 0 → Day 3
owning_lead: product-lead
---
```

### Structure

- **Purpose** — one-paragraph statement of the pipeline lane this tracker covers
- **Usage guide** — how to add a feature entry; when a checkbox flips
- **Per-feature template** — copy-paste block for a new feature entry:
  - Feature slug (kebab-case)
  - Origin (customer PDF / internal brief / market opportunity)
  - Intake artifact path (`.kiro/product/intake/<slug>/`)
  - Assigned agent (`spec-intake-analyst` for Phase 0, `academorix-product` for
    Phase 1-2)
  - Phase 0 checkboxes:
    - [ ] `brief.md` written
    - [ ] `blueprint-draft.md` written (matches
          `.ref/DOMAIN_MODULES_BLUEPRINT.md` shape)
    - [ ] `assumptions.md` written
    - [ ] `reading-list.md` written
  - Phase 1 checkboxes:
    - [ ] Personas identified
    - [ ] JTBD map written
    - [ ] Competitive matrix written
    - [ ] Opportunity brief written
  - Phase 2 checkboxes:
    - [ ] PRD written (`.kiro/product/prds/<slug>.md`)
    - [ ] INVEST stories written
    - [ ] v1/v2/later scope locked
    - [ ] Business-type strategy (Academy/Salon/Gym/Clinic) settled
- **Current features in flight** — empty at first; agents append
- **Log** — dated entries logging phase transitions

### Invocation blocks

Every phase transition includes a copy-paste `invoke_sub_agent` block:

```
invoke_sub_agent(
  name: 'spec-intake-analyst',
  prompt: 'Read <feature>/brief-raw.pdf and emit the four Phase 0 files
           under .kiro/product/intake/<feature>/.',
  contextFiles: [
    { path: '.kiro/product/intake/<feature>/brief-raw.pdf' },
    { path: '.ref/DOMAIN_MODULES_BLUEPRINT.md' }
  ],
)
```

---

## 2. `tasks-design-pipeline.md`

Phase 3 tracker (~244 lines). Covers Day-4 → Day-7 (design-lead orchestrates 5-6
specialists in parallel rounds).

### Frontmatter

```yaml
---
title: Tasks — Design Pipeline (Phase 3)
status: active
phase: 3
duration_target: Day 4 → Day 7
owning_lead: design-lead
---
```

### Structure

- **Purpose** — orchestration model for Phase 3
- **Round-based coordination model**:
  - **Round 1** — solution-architect + data-modeler run in parallel (both need
    the PRD but not each other)
  - **Round 2** — api-contract-designer + threat-modeler run in parallel (both
    consume Round 1's ADR + ERD)
  - **Round 3** — product-designer runs alone (consumes all three prior rounds)
  - **Round 4** — docs-adr-steward formalizes every artifact + cross-links
- **Per-feature template**:
  - Feature slug
  - Prerequisite Phase 2 artifact paths (PRD, personas, stories)
  - Round 1 checkboxes:
    - [ ] `solution-architect` → `docs/adr/00XX-<slug>-architecture.md`
    - [ ] `data-modeler` → `docs/erd/<slug>.md` + migration plan
  - Round 2 checkboxes:
    - [ ] `api-contract-designer` → `docs/contracts/<slug>-request.schema.json`
      - `<slug>-response.schema.json` + OpenAPI fragment
    - [ ] `threat-modeler` → `docs/security/threat-models/<slug>.md`
  - Round 3 checkboxes:
    - [ ] `product-designer` → `.kiro/product/designs/<slug>/*.md` (screen
          contracts, IA, flows, wireframes-as-markdown)
  - Round 4 checkboxes:
    - [ ] `docs-adr-steward` → ADR promoted to `status: accepted`
    - [ ] Cross-references verified (steering, roster)
- **Go/no-go criteria** — checklist that gates Phase 4 handoff:
  - Every artifact exists at the expected path
  - `security-lead` reviewed threat model
  - `data-lead` reviewed ERD + column contracts
  - `docs-lead` verified ADR cross-links
- **Current features in design** — empty at first
- **Log**

### Invocation blocks

Provide four `invoke_sub_agent` copy-paste blocks — one per round — so the
design-lead can walk the pipeline as a script.

---

## 3. `tasks-ship-and-operate.md`

Phase 6-7 tracker (~265 lines). Covers Day-26 → Day-90+ (release management +
operations).

### Frontmatter

```yaml
---
title: Tasks — Ship & Operate (Phase 6-7)
status: active
phase_start: 6
phase_end: 7
duration_target: Day 26 → Day 90+
owning_leads:
  - release-manager       (Phase 6)
  - sre-lead              (Phase 7)
---
```

### Structure

- **Purpose** — how a release moves from Phase 5 (Verify) into Phase 6 (Ship)
  and how ongoing Phase 7 (Operate) is tracked
- **Phase 6 — Release template**:
  - Release ID (`vX.Y.Z`)
  - Release owner (delegated by `release-manager`)
  - Prerequisite Phase 5 gates (all reviewer artifacts green)
  - Checkboxes:
    - [ ] Changesets consolidated
    - [ ] Version bumps applied
    - [ ] Release notes drafted (via `docs/release-notes.stub` skeleton)
    - [ ] Migration guide written (if breaking)
    - [ ] Tag cut
    - [ ] `deploy-engineer` canary plan prepared
    - [ ] Canary deployed
    - [ ] Canary metrics observed for N hours
    - [ ] Promote to full deploy
    - [ ] Rollback plan documented
- **Phase 7 — Operational template**:
  - Service / feature
  - Owning on-call rotation
  - Alert enabled — checkbox
  - PagerDuty routing wired — checkbox
  - SLI defined — checkbox
  - SLO agreed — checkbox
  - Runbook committed (`docs/runbooks/<service>.md`) — checkbox
  - Sentry alert rules wired — checkbox
  - Grafana dashboard published — checkbox
  - Log-routing configuration deployed — checkbox
- **Incident log** — one row per real incident with post-mortem link
- **SLI/SLO status board** — table of every tracked service with current SLO
  burn rate
- **Coverage checklist** — cross-references to `sre-lead` +
  `observability-engineer` + `incident-commander`
- **Log** — dated entries

### Invocation blocks

Two blocks: one for `release-manager` (Phase 6 orchestrator), one for `sre-lead`
(Phase 7 orchestrator).

---

## 4. `AGENT_QUICKSTART.md`

Day-1 playbook (~368 lines). Companion to `AGENT_ROSTER.md`. Six recipes.

### Frontmatter

```yaml
---
title: Agent Quickstart — Day-1 Playbook
audience: humans + orchestrators
sibling_docs:
  - AGENT_ROSTER.md
  - .kiro/agents/README.md
---
```

### Structure

- **Intro** — how to use this file; when to read AGENT_ROSTER.md instead
- **Recipe 0 — Bootstrap a new workspace with `academorix new`** (Day -1)
  - Prerequisites (Composer 2, Node 22+, pnpm 10, Doppler CLI)
  - Install the CLI globally OR via `pnpm --filter academorix/cli exec ...`
  - Run `academorix new my-project`
  - What gets created (points at three templates)
  - What comes next (Recipe 1)
- **Recipe 1 — Intake a PDF and emit a project blueprint** (Day 0)
  - Drop PDF at `.kiro/product/intake/raw/<slug>/BRD.md`
  - Invoke `spec-intake-analyst` with `invoke_sub_agent`
  - Output shape: brief + blueprint-draft + assumptions + reading-list
  - Handoff to Recipe 2
- **Recipe 2 — Turn a brief into a PRD + INVEST stories** (Day 1-3)
  - Invoke `product-lead`
  - `product-lead` fans out to `academorix-product` (writer) for the actual
    authoring
  - Update `tasks-intake-discovery-definition.md` at each phase gate
- **Recipe 3 — Design phase (5 specialists coordinated in rounds)** (Day 4-7)
  - Invoke `design-lead` (orchestrator)
  - Design-lead walks `tasks-design-pipeline.md` round by round
  - Output: ADR + ERD + OpenAPI + threat model + screen contracts
- **Recipe 4 — Build phase (fan out to lanes)** (Day 8-20)
  - Invoke `delivery-lead` (orchestrator)
  - Fans out to `laravel-feature-builder`, `heroui-ui-builder`,
    `heroui-native-builder`, `python-service-builder` in parallel
  - Standards + docs stewards run continuously
- **Recipe 5 — Ship + Operate** (Day 26+)
  - Invoke `release-manager`
  - Update `tasks-ship-and-operate.md` at every gate
  - `sre-lead` picks up post-canary
- **Common pitfalls** — three top failure modes and how to avoid them
- **Cheat sheet** — one-line CLI invocation for each recipe
- **Changelog** — dated log

### Recipe format (consistent across all six)

Every recipe has:

- **Goal** — one sentence
- **Duration** — day range
- **Prerequisites** — checklist
- **Steps** — numbered, each with a copy-paste block
- **Outputs** — file paths that should exist after
- **Handoff** — next recipe

---

## 5. `.kiro/skeletons/` — 10 substrate templates

Home for hand-copy templates. NOT machine-consumed by the CLI (that's
`tools/cli/src/Stubs/stubs/` — see `stubs-tasks.md`). These are substrate that
gets promoted into its target location by humans/agents adding new artifacts of
the same shape.

### 5.1 `.kiro/skeletons/README.md`

Index + promotion instructions:

- What each skeleton is for
- Where to copy it when using it (e.g., `runbook.md` → `docs/runbooks/`)
- Which agents own each skeleton category
- How to modify a skeleton (add a template variable, keep the substrate simple)

### 5.2 `.kiro/skeletons/lighthouserc.js`

Lighthouse CI base config. Placeholder budgets that consumers tune when they
promote to a real app.

### 5.3 `.kiro/skeletons/size-limit.json`

Bundle-size budgets. Empty array with TODO comments — apps drop in their real
entries when they need bundle enforcement.

### 5.4 `.kiro/skeletons/a11y-audit.yml`

GitHub Action skeleton: runs axe-core + Lighthouse a11y audit + posts result
comment on PR. Placeholder trigger paths.

### 5.5 `.kiro/skeletons/k6-scenario.js`

Load-test scenario base. Placeholder stages + endpoints; comments explain how to
promote.

### 5.6 `.kiro/skeletons/sentry-project.yaml`

Sentry project + alert rules skeleton. Two example alerts (error rate, new
issue) — consumers fill in real thresholds.

### 5.7 `.kiro/skeletons/grafana-dashboard.json`

Service-health dashboard JSON. Four base panels (request rate, error rate, p95
latency, saturation) with placeholder metric queries.

### 5.8 `.kiro/skeletons/runbook.md`

Canonical runbook template. Sections: severity, service, PagerDuty routing,
escalation, diagnostic queries, mitigation steps, rollback, post-incident.
Aligned with `docs/runbook.stub` (CLI-generated shape) but includes prose
scaffolding a human agent fills in.

### 5.9 `.kiro/skeletons/adr.md`

Canonical ADR template. Sections: Context, Decision, Alternatives Considered,
Consequences, Rollout, Reversibility. Aligned with the CLI's `docs/adr.stub` —
same shape, different consumer (human vs machine).

### 5.10 `.kiro/skeletons/release-pr.md`

Release PR description template. Sections: TL;DR, new features, breaking
changes, migration steps, fixes, verify checklist, known issues, rollback plan.

### Relationship to `stubs-tasks.md`

`tools/cli/src/Stubs/stubs/docs/{runbook,adr,release-notes}.stub` are
CLI-consumed template files with `{{ tokenName }}` markers. The skeletons here
are the same conceptual shape but for HUMAN authoring — they have prose
scaffolding + TODO comments rather than tokens.

Both exist because the CLI generates initial versions and humans expand them;
the skeletons are the shape humans start from when NOT going through the CLI
(e.g., emergency runbook for an existing service).

---

## Coordination with `agents-tasks.md`

The trackers reference agents by slug. Every agent slug used in these files MUST
exist in `.kiro/agents/`. If a sub-agent finds a slug this task uses that
doesn't have a charter, it flags it — do NOT create the missing charter here
(that's `agents-tasks.md` scope).

Every recipe in `AGENT_QUICKSTART.md` references `AGENT_ROSTER.md §Phase-N` for
context — the roster is the authoritative pipeline plan.

---

## Verify

```sh
# 1. Four trackers exist at workspace root
ls -la tasks-intake-discovery-definition.md \
       tasks-design-pipeline.md \
       tasks-ship-and-operate.md \
       AGENT_QUICKSTART.md

# 2. Line counts approximate the target
wc -l tasks-intake-discovery-definition.md   # → ~186
wc -l tasks-design-pipeline.md               # → ~244
wc -l tasks-ship-and-operate.md              # → ~265
wc -l AGENT_QUICKSTART.md                    # → ~368

# 3. Existing Phase 4/5 trackers untouched
ls -la tasks-frontend-orchestration.md tasks-backend-orchestration.md

# 4. All 10 skeletons in place
ls -1 .kiro/skeletons/{README.md,lighthouserc.js,size-limit.json,\
a11y-audit.yml,k6-scenario.js,sentry-project.yaml,grafana-dashboard.json,\
runbook.md,adr.md,release-pr.md} 2>&1 | grep -c '^\.kiro'   # → 10

# 5. Every agent slug in the trackers has a charter
python3 - <<'PY'
import re, pathlib
tracker_files = ['tasks-intake-discovery-definition.md',
                 'tasks-design-pipeline.md',
                 'tasks-ship-and-operate.md',
                 'AGENT_QUICKSTART.md']
slugs = set()
for f in tracker_files:
    for m in re.finditer(r"name:\s*['\"]([a-z-]+)['\"]", pathlib.Path(f).read_text()):
        slugs.add(m.group(1))
missing = [s for s in slugs if not pathlib.Path(f'.kiro/agents/{s}.md').exists()]
if missing: print('MISSING agent charters for:', *missing, sep='\n')
else: print(f'All {len(slugs)} referenced agent slugs have charters.')
PY

# 6. AGENT_QUICKSTART.md has 6 recipes
grep -c '^## Recipe ' AGENT_QUICKSTART.md   # → 6
```

---

## Source of truth

`fullplan.md` — search for "AGENT_QUICKSTART", "Recipe 0", "Recipe 1",
"tasks-intake-discovery-definition", "tasks-design-pipeline",
"tasks-ship-and-operate", "skeletons", "lighthouserc", "grafana-dashboard",
"runbook.md". Every line count target and section name is already fixed there.
