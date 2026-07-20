---
title: Tasks — Design Pipeline (Phase 3)
status: active
phase: 3
duration_target: Day 4 → Day 7
owning_lead: design-lead
---

# Tasks — Design Pipeline (Phase 3)

Phase-3 tracker for the design pipeline. Every feature that clears Phase 2
(signed-off PRD) enters here and moves through four rounds of specialist work
before it can hand off to the build lanes.

## Purpose

Phase 3 turns a PRD into a build-ready design package: architecture decision,
data model, API contracts, threat model, and screen contracts. The
`design-lead` orchestrates 5-6 specialists in coordinated rounds so parallel
work doesn't collide and every downstream artefact has its upstream input.

## Round-based coordination model

The five design specialists interact through shared artefacts (ADRs, ERDs,
OpenAPI, threat models, screen contracts). To parallelise without collision,
Phase 3 executes as four rounds — each round's specialists are independent
within the round, but each round consumes the prior round's outputs.

| Round | Specialists (parallel)                       | Consumes                          | Produces                                              |
| ----- | -------------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| 1     | `solution-architect` + `data-modeler`        | PRD, personas                     | ADR + ERD + column contracts + migration plan         |
| 2     | `api-contract-designer` + `threat-modeler`   | Round 1 outputs                   | OpenAPI + JSON Schemas + STRIDE model                 |
| 3     | `product-designer`                           | Round 1 + 2 outputs               | Screen contracts + IA + flows + wireframes-as-md      |
| 4     | `docs-adr-steward`                           | Every Round 1-3 output            | Cross-linked ADRs, promoted `status: accepted`        |

Rules:

- **No round skipping.** Round 3 without Round 2 = screen contracts without
  API vocabulary; Round 4 without Round 3 = ADRs without UX referents.
- **Rounds fire as a batch.** When `design-lead` opens Round N, it invokes
  every specialist in that round in one `invoke_sub_agent` batch. It only
  moves to Round N+1 when every specialist in Round N reports done.
- **Cross-round dependencies are explicit.** Round 2's specialists list the
  Round 1 artefacts they read in their invocation context; Round 3's designer
  lists both Round 1 + Round 2 artefacts. See invocation blocks below.

## Usage guide

1. When a feature arrives from `tasks-intake-discovery-definition.md`
   (Phase 2 green), copy the **Per-feature template** below into **Current
   features in design**.
2. Invoke Round 1 per the invocation blocks. Wait for both specialists to
   report done.
3. Invoke Round 2. Wait.
4. Invoke Round 3.
5. Invoke Round 4 to formalise ADRs.
6. Verify against the **Go/no-go criteria** below.
7. Log the transition and hand off to `tasks-frontend-orchestration.md` /
   `tasks-backend-orchestration.md` for Phase 4 build.

## Per-feature template

Copy verbatim into **Current features in design** when starting a feature.

```markdown
### `<feature-slug>` — <one-line human title>

- **Prerequisites (Phase 2):**
  - PRD: `.kiro/product/prds/<slug>.md`
  - Personas: `.kiro/product/intake/<slug>/personas.md`
  - INVEST stories: `.kiro/product/prds/<slug>-stories.md`
- **Status:** round-1 / round-2 / round-3 / round-4 / handed-off
- **Assigned lead:** `design-lead`

**Round 1 — Architecture + Data**

- [ ] `solution-architect` → `docs/adr/00XX-<slug>-architecture.md`
      (module surface, service boundaries, tenancy pattern, entitlement gates)
- [ ] `data-modeler` → `docs/erd/<slug>.md` + migration plan
      (column contracts, `tenant_id` / `application_id` / `scope_node_id`
      per `.kiro/steering/tenancy-columns.md`)

**Round 2 — API + Threat model**

- [ ] `api-contract-designer` → `docs/contracts/<slug>-request.schema.json`
      + `<slug>-response.schema.json` + OpenAPI fragment
- [ ] `threat-modeler` → `docs/security/threat-models/<slug>.md`
      (STRIDE per component, attack tree per high-risk flow)

**Round 3 — Product design**

- [ ] `product-designer` → `.kiro/product/designs/<slug>/`
      (screen contracts, IA map, user flows, wireframes-as-markdown)

**Round 4 — Formalise + cross-link**

- [ ] `docs-adr-steward` → ADR promoted to `status: accepted`
- [ ] Cross-references verified (`AGENT_ROSTER.md`, steering, tenancy doc)
- [ ] Every Round 1-3 artefact linked from the ADR

**Go/no-go gate (Phase 4 handoff)**

- [ ] Every artefact exists at the expected path (see checklist below)
- [ ] `security-lead` reviewed the threat model — sign-off comment on the ADR
- [ ] `data-lead` reviewed the ERD + column contracts — sign-off comment
- [ ] `docs-lead` verified cross-links resolve
- [ ] Feature added to `tasks-frontend-orchestration.md` and
      `tasks-backend-orchestration.md`
```

## Go/no-go criteria (Phase 3 → Phase 4)

Before a feature can leave Phase 3 for the build lanes, every one of these
must be true:

- **Architecture:** `docs/adr/00XX-<slug>-architecture.md` exists,
  `status: accepted`, links every consuming module.
- **Data model:** `docs/erd/<slug>.md` exists with column contracts for every
  new / modified table. Every row-scope column (`tenant_id`, `application_id`,
  `scope_node_id`) documented per `.kiro/steering/tenancy-columns.md`.
- **API contracts:** `docs/contracts/<slug>-request.schema.json` and
  `<slug>-response.schema.json` exist + validate as JSON Schema Draft 2020-12.
  OpenAPI fragment merges into the app's `openapi.yaml` without conflict.
- **Threat model:** `docs/security/threat-models/<slug>.md` exists with STRIDE
  per component + attack trees per high-risk flow. `security-lead` sign-off.
- **Screen contracts:** `.kiro/product/designs/<slug>/` exists with screen
  contracts, IA, flows, and wireframes-as-markdown. Every INVEST story maps
  to at least one screen.
- **Cross-links:** every artefact links every other; docs-lead verified.
- **Sign-offs:** security-lead + data-lead + docs-lead — comments on the ADR.

If any of the above is false, the feature stays in Phase 3.

## Current features in design

*(none yet)*

## Invocation blocks

### Round 1 — Architecture + Data (parallel)

```
invoke_sub_agent(
  name: 'solution-architect',
  prompt: 'Read the PRD for feature <slug> and write the architecture ADR at
           `docs/adr/00XX-<slug>-architecture.md`. Cover module surface,
           service boundaries, transport (REST/JWT/events), tenancy pattern,
           entitlement gates. Follow the ADR skeleton at
           `.kiro/skeletons/adr.md`.',
  contextFiles: [
    { path: '.kiro/product/prds/<slug>.md' },
    { path: '.kiro/steering/tenancy-columns.md' },
    { path: '.kiro/steering/hierarchy.md' },
    { path: '.kiro/skeletons/adr.md' }
  ],
)

invoke_sub_agent(
  name: 'data-modeler',
  prompt: 'Read the PRD for feature <slug> and write the ERD at
           `docs/erd/<slug>.md` with column contracts. Enforce the
           three-axis row-attribution rule (`tenant_id`, `application_id`,
           `scope_node_id`) per the tenancy-columns steering.',
  contextFiles: [
    { path: '.kiro/product/prds/<slug>.md' },
    { path: '.kiro/steering/tenancy-columns.md' },
    { path: '.kiro/steering/hierarchy.md' }
  ],
)
```

### Round 2 — API + Threat model (parallel, consumes Round 1)

```
invoke_sub_agent(
  name: 'api-contract-designer',
  prompt: 'Read the Round 1 ADR + ERD for feature <slug> and author the
           JSON Schemas + OpenAPI fragment at
           `docs/contracts/<slug>-{request,response}.schema.json`.',
  contextFiles: [
    { path: 'docs/adr/00XX-<slug>-architecture.md' },
    { path: 'docs/erd/<slug>.md' },
    { path: '.kiro/steering/communication-patterns.md' }
  ],
)

invoke_sub_agent(
  name: 'threat-modeler',
  prompt: 'Read the Round 1 ADR + ERD for feature <slug> and author the
           STRIDE threat model at
           `docs/security/threat-models/<slug>.md`.',
  contextFiles: [
    { path: 'docs/adr/00XX-<slug>-architecture.md' },
    { path: 'docs/erd/<slug>.md' },
    { path: '.kiro/steering/tenancy-columns.md' }
  ],
)
```

### Round 3 — Product design (consumes Round 1 + 2)

```
invoke_sub_agent(
  name: 'product-designer',
  prompt: 'Read the Round 1 + Round 2 artefacts for feature <slug> and
           author the screen contracts + IA + flows + wireframes at
           `.kiro/product/designs/<slug>/`. Every INVEST story maps to at
           least one screen.',
  contextFiles: [
    { path: 'docs/adr/00XX-<slug>-architecture.md' },
    { path: 'docs/contracts/<slug>-request.schema.json' },
    { path: 'docs/contracts/<slug>-response.schema.json' },
    { path: '.kiro/product/prds/<slug>.md' },
    { path: '.kiro/steering/ui-components.md' }
  ],
)
```

### Round 4 — Formalise (consumes every Round 1-3 output)

```
invoke_sub_agent(
  name: 'docs-adr-steward',
  prompt: 'Feature <slug> has cleared Rounds 1-3 in Phase 3. Formalise the
           ADR at `docs/adr/00XX-<slug>-architecture.md`: promote to
           `status: accepted`, cross-link every Phase 3 artefact, verify
           references to steering + roster + skeletons.',
  contextFiles: [
    { path: 'docs/adr/00XX-<slug>-architecture.md' },
    { path: 'docs/erd/<slug>.md' },
    { path: 'docs/contracts/<slug>-request.schema.json' },
    { path: 'docs/security/threat-models/<slug>.md' },
    { path: '.kiro/product/designs/<slug>/screens.md' }
  ],
)
```

### Phase 3 → Phase 4 handoff

```
invoke_sub_agent(
  name: 'delivery-lead',
  prompt: 'Feature <slug> cleared Phase 3 with all Go/no-go criteria green.
           Add feature blocks to `tasks-frontend-orchestration.md` and
           `tasks-backend-orchestration.md` and orchestrate Phase 4 fan-out
           (laravel-feature-builder, framework-core-builder,
           heroui-ui-builder, heroui-native-builder).',
  contextFiles: [
    { path: 'docs/adr/00XX-<slug>-architecture.md' },
    { path: 'docs/erd/<slug>.md' },
    { path: 'docs/contracts/<slug>-request.schema.json' },
    { path: 'docs/contracts/<slug>-response.schema.json' },
    { path: '.kiro/product/designs/<slug>/screens.md' }
  ],
)
```

## Log

Dated entries. Format: `YYYY-MM-DDTHH:MM:SSZ — <slug> — <round> — <event> — <agent>`.

*(no entries yet)*

## Cross-references

- **Prerequisite tracker:** `tasks-intake-discovery-definition.md` (Phase 0-2)
- **Handoff targets:** `tasks-frontend-orchestration.md`,
  `tasks-backend-orchestration.md` (Phase 4)
- **Roster:** `AGENT_ROSTER.md` §Phase 3
- **Quickstart recipes:** `AGENT_QUICKSTART.md` §Recipe 3
- **Skeletons:** `.kiro/skeletons/adr.md` (ADR shape)
- **Steering:** `.kiro/steering/tenancy-columns.md`,
  `.kiro/steering/hierarchy.md`,
  `.kiro/steering/communication-patterns.md`,
  `.kiro/steering/ui-components.md`
