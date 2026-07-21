---
title: Tasks — Intake, Discovery, Definition (Phase 0-2)
status: active
phase_start: 0
phase_end: 2
duration_target: Day 0 → Day 3
owning_lead: product-lead
---

# Tasks — Intake, Discovery, Definition (Phase 0-2)

Phase-scoped tracker for the front half of the pipeline. Every new feature that
enters the workspace passes through this file first — from unstructured intake
(PDF / brief / customer email) to a signed-off PRD ready for the design phase.

## Purpose

- **Phase 0 (Day 0):** turn ambient input into structured artefacts.
- **Phase 1 (Day 1-2):** discovery — personas, JTBD, competitive lens.
- **Phase 2 (Day 3):** definition — PRD, INVEST stories, scope commitments.

Every feature that enters the pipeline gets its own block below (**Current
features in flight**). The block flips checkboxes as work advances; when every
Phase 2 checkbox is green the feature moves to `tasks-design-pipeline.md`.

## Usage guide

1. When a new feature enters (customer PDF, market brief, internal proposal):
   copy **Per-feature template** below into **Current features in flight** and
   assign a `feature slug` (kebab-case).
2. Drop the raw source at `.kiro/product/intake/raw/<slug>/BRD.md` (or PDF /
   DOCX — the intake analyst handles all common formats).
3. Invoke `spec-intake-analyst` per **Invocation blocks** below.
4. As checkboxes flip, log the transition in the **Log** section with a
   UTC timestamp and the agent that reported completion.
5. Once Phase 2 is green, add an entry to `tasks-design-pipeline.md` and mark
   the feature block as `status: handed-off`.

Rules:

- **No skipping phases.** Phase 1 without Phase 0 = a blueprint without a
  brief; Phase 2 without Phase 1 = a PRD without personas.
- **No re-authoring.** If a raw brief changes, revise the Phase 0 artefacts;
  don't shadow them with a new feature slug.
- **Log everything.** Every phase transition writes to the Log — reviewers
  need the audit trail.

## Per-feature template

Copy this block verbatim into **Current features in flight** when starting a
new feature.

```markdown
### `<feature-slug>` — <one-line human title>

- **Origin:** customer PDF / internal brief / market opportunity / other
- **Raw source:** `.kiro/product/intake/raw/<slug>/BRD.md` (or `.pdf` / `.docx`)
- **Intake artefacts:** `.kiro/product/intake/<slug>/`
- **PRD:** `.kiro/product/prds/<slug>.md`
- **Status:** in-progress / handed-off / abandoned
- **Assigned:** `spec-intake-analyst` (Phase 0) → `stackra-product` (Phase 1-2)

**Phase 0 — Intake**

- [ ] `brief.md` written
- [ ] `blueprint-draft.md` written (matches `.ref/DOMAIN_MODULES_BLUEPRINT.md`
      shape)
- [ ] `assumptions.md` written (flags every implicit assumption)
- [ ] `reading-list.md` written (references the intake analyst pulled from)

**Phase 1 — Discovery**

- [ ] Personas identified (with JTBD map)
- [ ] JTBD map written
- [ ] Competitive matrix written (top 3 competitors, feature parity table)
- [ ] Opportunity brief written (market size, expected impact, risks)

**Phase 2 — Definition**

- [ ] PRD written (`.kiro/product/prds/<slug>.md`)
- [ ] INVEST stories written (each story is independent, negotiable, valuable,
      estimable, small, testable)
- [ ] v1 / v2 / later scope locked (Now / Next / Later split, no ambiguity)
- [ ] Business-type strategy settled (Academy / Salon / Gym / Clinic — which
      surfaces get the feature, which stay dark)
- [ ] `docs-adr-steward` reviewed for cross-references
```

## Current features in flight

*(none yet — first feature entry will populate this section)*

## Invocation blocks

### Phase 0 → Phase 0 (raw intake → four intake artefacts)

```
invoke_sub_agent(
  name: 'spec-intake-analyst',
  prompt: 'Read `.kiro/product/intake/raw/<slug>/BRD.md` and emit the four
           Phase 0 files under `.kiro/product/intake/<slug>/`. Match the
           domain-modules blueprint shape at `.ref/DOMAIN_MODULES_BLUEPRINT.md`.',
  contextFiles: [
    { path: '.kiro/product/intake/raw/<slug>/BRD.md' },
    { path: '.ref/DOMAIN_MODULES_BLUEPRINT.md' }
  ],
)
```

### Phase 0 → Phase 1 (brief → discovery)

```
invoke_sub_agent(
  name: 'product-lead',
  prompt: 'Read the Phase 0 artefacts under `.kiro/product/intake/<slug>/`
           and orchestrate the Phase 1 discovery pass: personas, JTBD map,
           competitive matrix, opportunity brief.',
  contextFiles: [
    { path: '.kiro/product/intake/<slug>/brief.md' },
    { path: '.kiro/product/intake/<slug>/blueprint-draft.md' },
    { path: '.kiro/product/intake/<slug>/assumptions.md' }
  ],
)
```

### Phase 1 → Phase 2 (discovery → PRD + stories)

```
invoke_sub_agent(
  name: 'stackra-product',
  prompt: 'Read the Phase 0 + Phase 1 artefacts under
           `.kiro/product/intake/<slug>/` and write the Phase 2 PRD at
           `.kiro/product/prds/<slug>.md`. Include INVEST stories, v1/v2/later
           scope, and business-type surface strategy.',
  contextFiles: [
    { path: '.kiro/product/intake/<slug>/brief.md' },
    { path: '.kiro/product/intake/<slug>/blueprint-draft.md' },
    { path: '.kiro/product/prds/<slug>-discovery.md' }
  ],
)
```

### Phase 2 handoff → design pipeline

Once Phase 2 checkboxes are green, add a matching feature block to
`tasks-design-pipeline.md`:

```
invoke_sub_agent(
  name: 'design-lead',
  prompt: 'Feature <slug> has cleared Phase 2 with a signed-off PRD at
           `.kiro/product/prds/<slug>.md`. Add it to
           `tasks-design-pipeline.md` and orchestrate Round 1 of Phase 3.',
  contextFiles: [
    { path: '.kiro/product/prds/<slug>.md' },
    { path: 'tasks-design-pipeline.md' }
  ],
)
```

## Log

Dated entries. Format: `YYYY-MM-DDTHH:MM:SSZ — <slug> — <phase> — <event> — <agent>`.

*(no entries yet)*

## Cross-references

- **Roster:** `AGENT_ROSTER.md` §Phase 0-2 (spec-intake-analyst, product-lead,
  stackra-product)
- **Quickstart recipes:** `AGENT_QUICKSTART.md` §Recipe 1-2
- **Blueprint reference:** `.ref/DOMAIN_MODULES_BLUEPRINT.md`
- **Handoff target:** `tasks-design-pipeline.md` (Phase 3)
