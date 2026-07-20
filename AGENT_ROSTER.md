---
title: Academorix Agent Roster & Pipeline Plan
status: v1.0 adopted
version: 1.0
last_updated: 2026-07-20
---

# Academorix Agent Roster & Pipeline Plan

Day-0 to Day-90 delivery plan for the Academorix product built on Stackra. The
plan names every agent that touches a Academorix workstream, the phase it owns,
the artefacts it emits, and the handoffs into and out of its lane. It is a
delivery contract between Kiro's coordination primitives (sub-agents + hooks +
file-based state) and the human operator supervising the run.

## Executive summary

Kiro does not offer a swarm. Kiro offers a hub-and-spoke coordination model: a
supervisor turn (this file, or a person) invokes zero or more specialised
sub-agents via `invoke_sub_agent`, each with its own tool budget and its own
system prompt. Sub-agents cannot invoke other sub-agents. Hooks fire on
lifecycle events (session start, file save, tool use) and inject either a shell
command's stdout or a static prompt back into the current turn. Everything else
is file-based blackboard: trackers under `.kiro/product/*/` and reports under
`.kiro/reports/` are the shared memory across supervisor turns.

The 51-agent roster below is not "51 concurrent workers." It is 51 named
responsibilities, each with a charter under `.kiro/agents/<slug>.md`. A single
supervisor turn typically invokes one to three sub-agents in parallel. Multiple
supervisor turns run in sequence. Delivery velocity comes from parallelism
inside a wave (three sub-agents writing to disjoint file trees) and from strict
handoff contracts across waves (Phase N artefacts fully closed before Phase N+1
opens). Enterprise readiness comes from named accountability, not from head
count.

Read this file before invoking a sub-agent. Read the manager's charter before
invoking any specialist. Read `AGENT_QUICKSTART.md` for the two-minute onboard
narrative.

## Part I — Kiro coordination primitives

Kiro ships five primitives. Every workflow below composes them; nothing else is
available. Naming these makes the pipeline auditable — if a step invokes
something not on this list, it is a bug in the plan, not a new capability.

### I.1 Sub-agents (`invoke_sub_agent`)

- **Shape**: hub-and-spoke. One supervisor turn invokes one or more sub-agents.
  Sub-agents run isolated: fresh context, own system prompt, own tool budget. A
  sub-agent returns a single markdown response to the supervisor.
- **Parallelism**: multiple sub-agent calls in a single supervisor turn run in
  parallel. Sequential calls run one after the other inside one turn.
- **Isolation guarantee**: a sub-agent cannot see the supervisor's context or
  other sub-agents' context. Handoffs happen through the file system.
- **Cost profile**: each sub-agent pays a fixed context-establishment cost.
  Prefer three focused sub-agents in one supervisor turn over one generic
  sub-agent that switches roles.
- **Non-recursion**: a sub-agent cannot invoke `invoke_sub_agent` itself. Fan-
  out is exclusively at the supervisor layer.

### I.2 Hooks

- **Shape**: JSON files at `.kiro/hooks/<id>.json`. Each declares a trigger, an
  optional matcher regex, and an action (shell command or agent prompt).
- **Triggers used in this pipeline**: `SessionStart`, `PostFileSave`,
  `PostFileCreate`, `PostFileDelete`, `PreToolUse`, `PreTaskExec`,
  `PostTaskExec`, `UserPromptSubmit`, `Stop`.
- **Action types**: `command` (shell; stdout is injected on exit 0; exit 2
  blocks) and `agent` (static prompt appended to context).
- **Not for**: replacing sub-agents. A hook is a reflex, not a workflow. If the
  logic exceeds ~30 lines of shell or requires planning, promote it to a
  sub-agent.

### I.3 File-based state

- **Trackers**: `.kiro/product/<phase>/<slug>/tracker.md` per active feature.
  Every supervisor turn reads the tracker for the feature in flight and writes a
  stanza when the turn changes phase.
- **Reports**: `.kiro/reports/<agent-slug>/<date>-<slug>.md`. Every reviewer
  writes exactly one report per invocation. Reports are append-only; a re-run
  produces a new file with a `-v2` suffix.
- **Intakes**:
  `.kiro/product/intake/<slug>/{brief.md, blueprint-draft.md, assumptions.md, reading-list.md}`.
  Phase 0 emits four files; every downstream phase reads at least the brief.
- **Blueprints**: `blueprints/**/module.json` etc. Modified by `data-modeler` in
  Phase 3; read by builders in Phase 4.

### I.4 Steering + skills

- **Steering** at `.kiro/steering/*.md` carries workspace-wide rules — code
  standards, tenancy, events authoring, module lifecycle. Included automatically
  at every session start.
- **Skills** at `.kiro/skills/*/` bundle domain expertise a sub-agent can opt in
  to (HeroUI Pro, tailwind, HeroUI Native, design taste). Activated via
  `disclose_context` when the sub-agent needs the skill.

### I.5 Cross-repo canonical directory

The Academorix workspace is one of several repos in the Stackra org. Agents that
operate on multiple repos need a canonical home. The three-tier canonical-
directory model — parent-workspace agents, per-repo agents, git-ignored
reference copies — is decided in
[`docs/adr/0026-agent-canonical-directory.md`](./docs/adr/0026-agent-canonical-directory.md).
Every agent charter names the tier it belongs to.

## Part II — 8-phase pipeline

The pipeline runs left-to-right; every phase closes its artefacts before the
next opens. Phase 4 fans out across four lanes running in parallel; the fan-out
converges on Phase 5. The rest of the pipeline is strictly sequential.

```
Phase 0. INTAKE           spec-intake-analyst
   |                       (PDF/MD/DOCX -> structured brief.json)
Phase 1. DISCOVERY        academorix-product + ux-research-lead + market-research-analyst
   |                       (personas, JTBD, competitive matrix, opportunity brief)
Phase 2. DEFINITION       academorix-product
   |                       (PRD, INVEST stories, v1/v2/later scope)
Phase 3. DESIGN           solution-architect + api-contract-designer + data-modeler
                          + threat-modeler + product-designer + content-designer
   |                       (ADRs, OpenAPI/JSON schemas, ERD, threat model, IA)
Phase 4. BUILD (fan out)
                          Backend lane:     laravel-feature-builder -> standards-steward
                                            -> tenancy-compliance-auditor -> test-mutation-engineer
                          Frontend web:     framework-core-builder + heroui-ui-builder
                                            -> code-standards-steward + code-documentation-writer
                                            + support-utilities-steward + translator
                                            -> vitest-test-engineer
                          Frontend native:  heroui-native-builder -> native-test-engineer
                          AI service:       python-service-builder -> mlops-reviewer
                                            + data-scientist-reviewer
                          Cross-cutting:    workspace-standardization-steward,
                                            docs-adr-steward, docs-changesets-steward
   |
Phase 5. VERIFY           All reviewers in parallel + e2e-test-engineer,
                          performance-engineer, accessibility-audit-lead
   |                       (gates go/no-go for release)
Phase 6. SHIP             release-manager -> deploy-engineer
   |                       (tag, publish, canary, promote, rollback plan)
Phase 7. OPERATE          sre-lead + observability-engineer + incident-commander
                          + analytics-engineer + support-liaison + legal-compliance-officer
```

### II.1 Phase entry criteria

Each phase opens only when the previous phase closes. Closure is a file-system
signal, not a chat message.

- **Phase 0 -> 1**: `.kiro/product/intake/<slug>/brief.md` exists with all five
  required sections; `assumptions.md` names every open question with an owner.
- **Phase 1 -> 2**: `personas.md`, `jtbd.md`, `competitive-matrix.md`,
  `opportunity-brief.md` under the same intake directory.
- **Phase 2 -> 3**: `prd.md` with locked v1 scope; `stories.md` with every story
  sized (INVEST) and prioritised.
- **Phase 3 -> 4**: at least one accepted ADR under `docs/adr/`; every contract
  under `docs/contracts/*.schema.json`; an ERD checked into
  `docs/data/<slug>-erd.md`; a threat model under
  `.kiro/reports/threat-modeler/`.
- **Phase 4 -> 5**: `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint` all
  green on every workspace package touched by the change.
- **Phase 5 -> 6**: all reviewer lanes green (no P0/P1 findings unresolved);
  performance budget met; a11y baseline (WCAG 2.2 AA) met; e2e green in the
  canary environment.
- **Phase 6 -> 7**: release notes published; canary promoted to primary;
  rollback runbook attached to the release entry.

Skipping a criterion because "we know it's fine" is the failure mode this plan
exists to prevent.

### II.2 Reverse handoff (rollback)

Phase 5 findings frequently reopen Phase 4 (fix a bug) or Phase 3 (revise a
schema). Phase 7 incidents can reopen Phase 3 (design regression) or Phase 6
(deploy regression). The tracker records every reopen with the phase it returned
to and the reviewer that raised it.

## Part III — Organizational model

The 51 agents divide into three tiers: one supervisor (Chief Orchestrator),
seven leads (four team + three cross-cutting), and the specialists that report
into them. One sibling — the AI-service lane — reports laterally to the Delivery
Lead but owns its own review cadence.

### III.1 Chief Orchestrator

- **Slug**: `chief-orchestrator`
- **Role**: routes work between leads, closes phase gates, resolves reviewer
  conflicts (two reviewers disagreeing on the same finding), and enforces
  reviewer non-overlap (Part VI).
- **Advisory**: writes plans and gates; does not implement.

### III.2 Four team leads

Each team lead owns one to two phases end-to-end, manages a fixed roster of
specialists, and holds the phase-close signal.

| Lead          | Slug            | Owns                            | Manages                                                                                                      |
| ------------- | --------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Product Lead  | `product-lead`  | Phase 0 + Phase 1 + Phase 2     | spec-intake-analyst, academorix-product, ux-research-lead, market-research-analyst                           |
| Design Lead   | `design-lead`   | Phase 3 (design + content + IA) | product-designer, content-designer, api-contract-designer, ui-design-a11y-reviewer, accessibility-audit-lead |
| Delivery Lead | `delivery-lead` | Phase 4 across four lanes       | every builder + every steward + every test-writer                                                            |
| Quality Lead  | `quality-lead`  | Phase 5                         | every reviewer + e2e-test-engineer + performance-engineer + accessibility-audit-lead                         |

### III.3 Three cross-cutting stewards

The three cross-cutting leads span every phase; their reviewers appear in Phase
3 (design review) and Phase 5 (verify) and are ambiently on-call in Phase 4 for
builder questions.

| Lead          | Slug            | Owns                                                   | Manages                                                   |
| ------------- | --------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Security Lead | `security-lead` | threat modelling + security review + trust boundaries  | threat-modeler, security-compliance-reviewer              |
| Data Lead     | `data-lead`     | ERD + row-level attribution + analytics catalogs       | data-modeler, data-scientist-reviewer (dotted to AI lane) |
| Docs Lead     | `docs-lead`     | ADRs + steering + changesets + cross-service contracts | docs-adr-steward, docs-changesets-steward, translator     |

### III.4 AI-service sibling

The AI service is a separate repo (`academorix-ai-service`) and a separate
deployment. It reports laterally to Delivery Lead but owns its own build →
review cadence.

- **Sibling lead**: not a formal role in v1; Delivery Lead carries the
  responsibility.
- **Builders**: `python-service-builder`.
- **Reviewers**: `mlops-reviewer`, `data-scientist-reviewer`.
- **Bridge**: `data-lead` has a dotted-line to `data-scientist-reviewer` because
  analytics catalogues cross the boundary.

### III.5 Reporting lines

```
                         chief-orchestrator
                                 |
    +----------------+-----------+-----------+-----------------+
    |                |           |           |                 |
product-lead    design-lead delivery-lead quality-lead    (advisory:
    |                |           |           |             security-lead,
    |                |           |           |             data-lead,
    |                |           |           |             docs-lead)
    |                |           |           |
[roster]         [roster]    [roster]    [roster]
```

The three advisory leads (Security, Data, Docs) do not sit under a team lead;
they report directly to Chief Orchestrator and provide input to every team lead
they touch.

### III.6 Org chart (ASCII)

The full 51-agent org chart lives in
[`.kiro/product/agent-personas.md`](./.kiro/product/agent-personas.md) — the
persona dossier is the canonical org chart because it carries the direct-
reports and manages lines per persona. The chart above is a summary; the dossier
is source of truth.

## Part IV — Full 51-agent roster

Grouped by the phase they primarily operate in. Every agent has a charter at
`.kiro/agents/<slug>.md`; every persona lives in
`.kiro/product/agent-personas.md`. See Appendix A for the A-to-Z index.

### Phase 0 — Intake (1)

| #   | Slug                  | Role                                 | Charter                               |
| --- | --------------------- | ------------------------------------ | ------------------------------------- |
| 1   | `spec-intake-analyst` | Product Analyst · Intake & Discovery | `.kiro/agents/spec-intake-analyst.md` |

### Phase 1 — Discovery (3)

| #   | Slug                      | Role                         |
| --- | ------------------------- | ---------------------------- |
| 2   | `academorix-product`      | Product Manager · Enterprise |
| 3   | `ux-research-lead`        | UX Research Lead             |
| 4   | `market-research-analyst` | Market Research Analyst      |

### Phase 2 — Definition (1)

Reuses `academorix-product` — no new agent. Phase 2 is the PRD-authoring pass
and stays with the Product Manager for continuity with Discovery.

### Phase 3 — Design (6)

| #   | Slug                    | Role                  |
| --- | ----------------------- | --------------------- |
| 5   | `solution-architect`    | Solution Architect    |
| 6   | `api-contract-designer` | API Contract Designer |
| 7   | `data-modeler`          | Data Modeler          |
| 8   | `threat-modeler`        | Threat Modeler        |
| 9   | `product-designer`      | Product Designer      |
| 10  | `content-designer`      | Content Designer      |

### Phase 4 — Build (18)

Backend lane:

| #   | Slug                         | Role                                      |
| --- | ---------------------------- | ----------------------------------------- |
| 11  | `laravel-feature-builder`    | Senior Backend Engineer                   |
| 12  | `standards-steward`          | Standards Steward (Backend)               |
| 13  | `tenancy-compliance-auditor` | Tenancy Compliance Auditor                |
| 14  | `test-mutation-engineer`     | Test Mutation Engineer (Pest + Infection) |
| 15  | `codebase-housekeeper`       | Codebase Housekeeper                      |

Frontend web lane:

| #   | Slug                        | Role                                           |
| --- | --------------------------- | ---------------------------------------------- |
| 16  | `framework-core-builder`    | Framework Core Builder (@stackra/*)            |
| 17  | `heroui-ui-builder`         | Senior Frontend Engineer (HeroUI + HeroUI Pro) |
| 18  | `code-standards-steward`    | Code Standards Steward (Frontend)              |
| 19  | `code-documentation-writer` | Code Documentation Writer                      |
| 20  | `support-utilities-steward` | Support Utilities Steward                      |
| 21  | `vitest-test-engineer`      | Vitest Test Engineer                           |

Frontend native lane:

| #   | Slug                    | Role                  |
| --- | ----------------------- | --------------------- |
| 22  | `heroui-native-builder` | HeroUI Native Builder |
| 23  | `native-test-engineer`  | Native Test Engineer  |

AI service lane:

| #   | Slug                      | Role                    |
| --- | ------------------------- | ----------------------- |
| 24  | `python-service-builder`  | AI Service Engineer     |
| 25  | `mlops-reviewer`          | MLOps Reviewer          |
| 26  | `data-scientist-reviewer` | Data Scientist Reviewer |

Cross-cutting:

| #   | Slug                                | Role                              |
| --- | ----------------------------------- | --------------------------------- |
| 27  | `workspace-standardization-steward` | Workspace Standardization Steward |
| 28  | `docs-adr-steward`                  | Docs / ADR Steward                |
| 29  | `docs-changesets-steward`           | Docs / Changesets Steward         |
| 30  | `translator`                        | Translator (i18n)                 |

### Phase 5 — Verify (13)

All reviewers run in parallel against the same build artefact. Findings sort
into four severities (P0 → P3). P0/P1 findings block Phase 6.

| #   | Slug                                 | Role                                                |
| --- | ------------------------------------ | --------------------------------------------------- |
| 31  | `backend-architecture-reviewer`      | Principal Backend Architect (Laravel)               |
| 32  | `backend-platform-reviewer`          | Backend Platform Reviewer (queues, Octane, Doppler) |
| 33  | `container-di-architecture-reviewer` | DI / Container Architecture Reviewer                |
| 34  | `package-api-release-reviewer`       | Package API + Release Reviewer                      |
| 35  | `security-compliance-reviewer`       | Security + Compliance Reviewer                      |
| 36  | `ui-design-a11y-reviewer`            | UI Design + Accessibility Reviewer                  |
| 37  | `e2e-test-engineer`                  | End-to-End Test Engineer                            |
| 38  | `performance-engineer`               | Performance Engineer                                |
| 39  | `accessibility-audit-lead`           | Accessibility Audit Lead                            |

Delegated review helpers (already listed in Phase 4 but re-invoked in Phase 5):

| #   | Slug                         | Role                   |
| --- | ---------------------------- | ---------------------- |
| 40  | `test-mutation-engineer`     | (re-invoked in verify) |
| 41  | `vitest-test-engineer`       | (re-invoked in verify) |
| 42  | `native-test-engineer`       | (re-invoked in verify) |
| 43  | `tenancy-compliance-auditor` | (re-invoked in verify) |

### Phase 6 — Ship (2)

| #   | Slug              | Role            |
| --- | ----------------- | --------------- |
| 44  | `release-manager` | Release Manager |
| 45  | `deploy-engineer` | Deploy Engineer |

### Phase 7 — Operate (6)

| #   | Slug                       | Role                       |
| --- | -------------------------- | -------------------------- |
| 46  | `sre-lead`                 | SRE Lead                   |
| 47  | `observability-engineer`   | Observability Engineer     |
| 48  | `incident-commander`       | Incident Commander         |
| 49  | `analytics-engineer`       | Analytics Engineer         |
| 50  | `support-liaison`          | Support Liaison            |
| 51  | `legal-compliance-officer` | Legal / Compliance Officer |

### Cross-cutting leads (counted above)

The 8 leadership charters (`chief-orchestrator`, `product-lead`, `design-lead`,
`delivery-lead`, `quality-lead`, `security-lead`, `data-lead`, `docs-lead`) are
counted inside their respective phase totals (they act as routing brains, not as
an eighth "lead phase"). The 51 count is non-overlapping: an agent listed twice
in Part IV (like `test-mutation-engineer` in Phase 4 and Phase 5) is one agent
invoked twice, not two agents.

## Part V — Orchestration mechanics

Turning the pipeline into runnable turns.

### V.1 Handoff contract

Every phase closes with a **closure stanza** appended to the tracker:

```markdown
## Phase N — <name> — closed <ISO date>

- Artefacts: <path>, <path>
- Reviewers: <slug> (green | P2 findings deferred to <slug>)
- Next phase: <N+1 | reopen -> N-k>
- Blockers: <none | list>
```

The next phase's opening turn reads the closure stanza and confirms every
artefact is present before invoking any specialist.

### V.2 Parallel dispatch

A supervisor turn that fans out to N sub-agents follows one rule: **disjoint
file trees**. Two sub-agents writing to overlapping paths in the same turn is a
bug in the plan; fix the plan first. Every agent charter names the tree it owns
explicitly, and Part VI codifies non-overlap as a governance rule.

Practical parallel patterns in this pipeline:

- **Phase 3 design fan-out**: `solution-architect` + `api-contract-designer` +
  `data-modeler` + `threat-modeler` + `product-designer` in parallel. Every one
  writes into a different tree (`docs/adr/`, `docs/contracts/`, `docs/data/`,
  `.kiro/reports/threat- modeler/`, `docs/design/`).
- **Phase 4 build fan-out**: backend builder + frontend web builder + frontend
  native builder + AI-service builder in parallel. Each lane runs its own
  steward-then-test-writer sequence internally.
- **Phase 5 review fan-out**: every reviewer in parallel against the same build.

### V.3 Reviewer non-overlap

Phase 5 has 13 reviewers. Overlap is the failure mode. The non-overlap matrix in
[`.kiro/agents/README.md`](./.kiro/agents/README.md) assigns each concern to
exactly one reviewer. If two reviewers file a finding on the same concern,
`chief-orchestrator` routes to the correct owner and drops the duplicate.

### V.4 Escalation

Two conflicts escalate to `chief-orchestrator`:

1. **Reviewer collision**: two reviewers file P0/P1 on the same finding with
   contradictory guidance.
2. **Cross-phase reopen**: a Phase 5 reviewer wants to reopen Phase 3. Chief
   decides whether to reopen or defer.

No other conflict escalates. Design taste, code style, tone — those are the
relevant steward's call, not chief's.

## Part VI — Governance rules

The rules that make the plan safe to run at scale.

### VI.1 Non-overlap

Two agents do not own the same concern. If a concern is contested, chief splits
it into two sub-concerns and gives each a single owner. The charter file names
the exact scope; the persona dossier names the human-readable responsibility.

### VI.2 Artifact ownership

Every file has exactly one authoring agent. Sub-agents writing to a file another
agent owns fail closed — the file is a merge conflict, and chief resolves.

### VI.3 Single source of truth per concern

Every concern has one canonical file. When two files carry the same information,
the older one is deleted or made a pointer.

- **Steering**: `.kiro/steering/*.md`
- **ADRs**: `docs/adr/*.md`
- **Contracts**: `docs/contracts/*.schema.json`
- **Charters**: `.kiro/agents/*.md`
- **Personas**: `.kiro/product/agent-personas.md`
- **Roster + plan**: this file

### VI.4 Charter changes require ADR

Renaming or splitting an agent creates a new charter and an ADR. Both land in
the same commit. No orphan aliases.

## Part VII — Enterprise readiness lanes

Enterprise readiness is not one team's job. Four lanes cut across every phase.

### VII.1 Security lane

- **Owner**: `security-lead`.
- **Phase touch points**: Phase 3 (`threat-modeler`), Phase 5
  (`security-compliance-reviewer`), Phase 7 (`incident-commander` for security
  incidents).
- **Non-negotiables**: STRIDE model per feature; JWT service-to-service signed
  with per-app HS256 secret from Doppler; PII/PHI/CBRN blocked in AI tool
  surfaces via `Sensitivity` enum at design time.
- **Regime evidence**: `.kiro/reports/security-compliance-reviewer/` carries the
  artefact trail for SOC 2 + ISO 27001 audits.

### VII.2 Compliance lane

- **Owner**: `legal-compliance-officer` (Phase 7); design input from
  `security-lead` (Phase 3); review from `security-compliance-reviewer` (Phase
  5).
- **Regimes tracked**: GDPR (EEA), FERPA (US education), COPPA (US minors), CCPA
  (California), PCI-DSS (payments), WCAG 2.2 AA (accessibility), SOC 2,
  ISO 27001.
- **Retention windows**: tenant-tier driven per `.kiro/steering/hierarchy.md §7`
  (Small: 90d audit, Medium: 1y, Enterprise: 7y).
- **DSAR + erasure**: `compliance-service` runs quarterly; artefacts under
  `.kiro/reports/legal-compliance-officer/`.
- **Minor consent**: `product-lead` + `security-lead` co-sign every
  Sports-domain feature involving minors; evidence in the PRD.

### VII.3 SRE lane

- **Owner**: `sre-lead`.
- **Phase touch points**: Phase 3 (SLO definition), Phase 5 (SLO verification),
  Phase 7 (on-call + runbooks).
- **Non-negotiables**: SLIs published for every user-visible surface; SLOs
  reviewed quarterly; every alert has an owning runbook under `docs/runbooks/`.

### VII.4 DR lane

- **Owner**: `sre-lead` + `deploy-engineer` co-own.
- **Non-negotiables**: RPO ≤ 15 minutes for tenant data; RTO ≤ 1 hour for full
  service; multi-region deployable per the platform-architecture DECISION doc.
- **Drills**: quarterly `disaster-recovery-drill` under
  `.kiro/reports/sre-lead/`; the drill is a Phase 5 pattern (dry-run in a
  non-prod region, promote traffic, revert).

## Part VIII — Rollout plan

Which agents to build first. The pipeline is designed to be introduced in three
tranches so we get value out of every day of the 90-day window.

### VIII.1 Day 0 — Foundation (this file, personas, README, charters, hooks)

Land the plan on disk. No feature work.

- `AGENT_ROSTER.md` (this file).
- `.kiro/product/agent-personas.md` (persona dossier).
- `.kiro/agents/README.md` (agent directory README).
- 21 new agent charters — the leadership + discovery/design + verify + ship +
  operate roles the workspace does not yet have.
- `docs/adr/0026-agent-canonical-directory.md`.
- 4 hooks (`.kiro/hooks/*.json`) that keep the docs consistent as they evolve.

### VIII.2 Day 1–30 — Pipeline pilot (one feature end-to-end)

Pick one small feature. Run it through Phase 0 → Phase 6 end-to-end. Every
handoff is exercised at least once. Every reviewer files at least one report.
Every closure stanza is written.

Recommended pilot: one Academorix Sports resource (Athlete or Team) with CRUD +
basic list UI + one AI-service endpoint. Small enough to close in 30 days; big
enough to touch every lane.

### VIII.3 Day 31–60 — Parallel lanes (three features in flight)

Once the pipeline pattern is exercised, run three features in parallel. This
exercises reviewer non-overlap under load and surfaces every hidden coordination
cost.

### VIII.4 Day 61–90 — Operate at pace (Phase 7 exercise)

By day 60, the first three features are in Phase 6/7. Day 61–90 exercises Phase
7: on-call rotations, incident drills, DR drills, first-party analytics, first
support tickets.

At Day 90, review: which charters were invoked most? Which artefacts were
skipped? Which handoffs stalled? Cut and merge as needed; each change requires
an ADR per VI.4.

## Appendices

### Appendix A — A-to-Z agent index

`academorix-product`, `accessibility-audit-lead`, `analytics-engineer`,
`api-contract-designer`, `backend-architecture-reviewer`,
`backend-platform-reviewer`, `chief-orchestrator`, `code-documentation-writer`,
`code-standards-steward`, `codebase-housekeeper`,
`container-di-architecture-reviewer`, `content-designer`, `data-lead`,
`data-modeler`, `data-scientist-reviewer`, `delivery-lead`, `deploy-engineer`,
`design-lead`, `docs-adr-steward`, `docs-changesets-steward`, `docs-lead`,
`e2e-test-engineer`, `framework-core-builder`, `heroui-native-builder`,
`heroui-ui-builder`, `incident-commander`, `laravel-feature-builder`,
`legal-compliance-officer`, `market-research-analyst`, `mlops-reviewer`,
`native-test-engineer`, `observability-engineer`,
`package-api-release-reviewer`, `performance-engineer`, `product-designer`,
`product-lead`, `python-service-builder`, `quality-lead`, `release-manager`,
`security-compliance-reviewer`, `security-lead`, `solution-architect`,
`spec-intake-analyst`, `sre-lead`, `standards-steward`, `support-liaison`,
`support-utilities-steward`, `tenancy-compliance-auditor`,
`test-mutation-engineer`, `threat-modeler`, `translator`,
`ui-design-a11y-reviewer`, `ux-research-lead`, `vitest-test-engineer`,
`workspace-standardization-steward`.

### Appendix B — Task tracking

Every active feature carries a tracker at
`.kiro/product/<phase>/<slug>/ tracker.md`. Skeletons live at
`.kiro/skeletons/`. The tracker records:

- Feature slug + owner.
- Current phase.
- Phase-open + phase-close timestamps.
- Reviewer findings (P0 → P3).
- Reopens (from Phase → back to Phase).
- Artefact paths.

### Appendix C — Steering references

Reading order for a new supervisor picking this up cold:

1. This file (`AGENT_ROSTER.md`).
2. `.kiro/product/agent-personas.md`.
3. `.kiro/agents/README.md`.
4. `.kiro/steering/hierarchy.md`.
5. `.kiro/steering/tenancy-columns.md`.
6. `.kiro/steering/code-standards.md`.
7. `.kiro/steering/module-lifecycle.md`.
8. `.kiro/steering/events-authoring.md`.
9. `AGENT_QUICKSTART.md` (two-minute onboard).

### Appendix D — Glossary

- **Advisory agent** — writes plans, reviews, and analyses; does not modify
  source code.
- **Blackboard** — file-system shared state used to hand off work between
  supervisor turns and sub-agents.
- **Charter** — `.kiro/agents/<slug>.md`. Names the agent's scope, tools,
  operating constraints, and verify checklist.
- **Closure stanza** — the phase-close markdown block appended to the tracker at
  every phase transition.
- **Hub-and-spoke** — the sub-agent orchestration shape: one supervisor turn
  invokes N sub-agents, each in isolation.
- **INVEST** — story-quality checklist: Independent, Negotiable, Valuable,
  Estimable, Small, Testable.
- **JTBD** — Jobs-To-Be-Done, the discovery-phase user-motivation framework.
- **Non-overlap** — governance rule: two agents do not own the same concern.
- **Persona** — `.kiro/product/agent-personas.md` entry. Names the human-
  readable dossier (bio, expertise, portrait brief) attached to each agent slug.
- **PRD** — Product Requirements Document, Phase 2 output.
- **Reopen** — a phase transition back to an earlier phase due to a reviewer or
  incident finding.
- **Reviewer non-overlap** — Part V.3 rule: every Phase 5 concern has one
  reviewer.
- **Sensitivity enum** — AI-service tool metadata (`Public` / `Pii` / `Medical`
  / `Financial`) that gates writes at design time.
- **STRIDE** — threat-modelling framework (Spoofing, Tampering, Repudiation,
  Information disclosure, Denial of service, Elevation of privilege).
- **Sub-agent** — a `invoke_sub_agent` invocation. Fresh context, own system
  prompt, own tool budget. Cannot recurse.
- **Tracker** — `.kiro/product/<phase>/<slug>/tracker.md`. Per-feature living
  state; the closure stanza is appended here.
- **v1 / v2 / later** — scope buckets used in the PRD to phase the feature set.

---

Read this file on every session start. When any agent seems missing or
overlapping with another, consult Part IV first, then the individual charter
under `.kiro/agents/<slug>.md`, and only then escalate to `chief-orchestrator`.
