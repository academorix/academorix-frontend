# Agent directory

Kiro sub-agents that operate inside the Stackra stack. Every `.md` file in
this folder is a specialised agent with its own tools, orient-first reading
list, scope, out-of-scope, and required output shape.

This directory is the runtime surface: `invoke_sub_agent(name: "<slug>")`
resolves to the matching `<slug>.md` file. The plan-level narrative lives in
[`../../AGENT_ROSTER.md`](../../AGENT_ROSTER.md); the human dossier lives in
[`../product/agent-personas.md`](../product/agent-personas.md).

Every agent orients against the repo's ground truth before acting:
`AGENT_ROSTER.md`, `.kiro/steering/*.md`, the ADRs under
[`../../docs/adr/`](../../docs/adr/), and the cross-service contract schemas
under [`../../docs/contracts/`](../../docs/contracts/) when present.

## Cross-repo strategy

Stackra spans three repos with overlapping agent needs (frontend, backend, AI
service). The canonical directory model is defined in
[`../../docs/adr/0026-agent-canonical-directory.md`](../../docs/adr/0026-agent-canonical-directory.md).
Three tiers govern where a given charter lives:

1. **Truly cross-repo agents** (product, security, docs, delivery leads;
   translator; docs stewards) live in the parent `stackra/.kiro/agents/` with
   sub-repo symlinks. This directory carries the live copies until the parent is
   bootstrapped; ADR-0026 covers the migration.
2. **Repo-specific agents** live in this repo's `.kiro/agents/`
   (`heroui-ui-builder`, `framework-core-builder`, `heroui-native-builder`,
   `vitest-test-engineer`, `translator`).
3. **Reference-only copies** live under `.ref/agents/` and are never
   authoritative.

See [ADR-0026](../../docs/adr/0026-agent-canonical-directory.md) for the
migration plan, rollout timeline, and reversibility clause.

## The full 51-agent roster

Fifty-one agents across eight pipeline phases. Some are directory-only in the
persona dossier (recognised but without a live charter yet); the rest have
charter files here (or in a sibling repo for AI-service specialists).

### Executive tier (1)

| Slug                 | Role                         | Charter                                        |
| -------------------- | ---------------------------- | ---------------------------------------------- |
| `chief-orchestrator` | Head of Engineering Delivery | [chief-orchestrator.md](chief-orchestrator.md) |

### Vertical leads (7)

| Slug            | Role          | Owns                                         |
| --------------- | ------------- | -------------------------------------------- |
| `product-lead`  | Product Lead  | Discovery + Definition                       |
| `design-lead`   | Design Lead   | Design phase, UX system, design taste        |
| `delivery-lead` | Delivery Lead | Build phase across all four lanes            |
| `quality-lead`  | Quality Lead  | Verify phase; all reviewers                  |
| `security-lead` | Security Lead | Threat model, RBAC, minor consent, retention |
| `data-lead`     | Data Lead     | Data model, analytics, ML ops                |
| `docs-lead`     | Docs Lead     | ADRs, steering, changesets, contracts        |

### Product + Discovery (4)

| Slug                      | Role                         | Phases | Charter present |
| ------------------------- | ---------------------------- | ------ | --------------- |
| `spec-intake-analyst`     | Intake analyst               | 0, 1   | yes             |
| `stackra-product`      | Product manager (enterprise) | 1, 2   | yes (existing)  |
| `ux-research-lead`        | UX research lead             | 1      | directory-only  |
| `market-research-analyst` | Market research analyst      | 1      | directory-only  |

### Design (6)

| Slug                    | Role                          | Charter present |
| ----------------------- | ----------------------------- | --------------- |
| `solution-architect`    | Pre-code cross-cutting design | yes             |
| `api-contract-designer` | Schema-first API design       | yes             |
| `data-modeler`          | ERD + column contracts        | yes             |
| `threat-modeler`        | STRIDE + attack trees         | yes             |
| `product-designer`      | IA + wireframes-as-markdown   | yes             |
| `content-designer`      | Voice + terminology system    | directory-only  |

### Backend build lane (5)

| Slug                         | Role                       | Charter present |
| ---------------------------- | -------------------------- | --------------- |
| `laravel-feature-builder`    | Backend feature builder    | yes (existing)  |
| `standards-steward`          | Backend standards steward  | yes (existing)  |
| `codebase-housekeeper`       | Backend compliance sweeper | yes (existing)  |
| `tenancy-compliance-auditor` | Row-attribution auditor    | yes (existing)  |
| `test-mutation-engineer`     | Pest + mutation engineer   | yes (existing)  |

### Frontend web build lane (7)

| Slug                        | Role                              | Charter present |
| --------------------------- | --------------------------------- | --------------- |
| `framework-core-builder`    | Non-UI `@stackra/*` builder       | yes (existing)  |
| `heroui-ui-builder`         | React + HeroUI builder            | yes (existing)  |
| `code-standards-steward`    | Frontend standards steward        | yes (existing)  |
| `code-documentation-writer` | In-source docblock writer         | yes (existing)  |
| `support-utilities-steward` | Support-utility migration steward | yes (existing)  |
| `translator`                | i18n catalog scaffolder           | yes (existing)  |
| `vitest-test-engineer`      | Vitest + RTL test engineer        | yes (existing)  |

### Frontend native build lane (2)

| Slug                    | Role                                 | Charter present |
| ----------------------- | ------------------------------------ | --------------- |
| `heroui-native-builder` | React Native + HeroUI Native builder | directory-only  |
| `native-test-engineer`  | Jest + Detox test engineer           | directory-only  |

### AI service build lane (3)

| Slug                      | Role                               | Charter present               |
| ------------------------- | ---------------------------------- | ----------------------------- |
| `python-service-builder`  | AI service builder                 | directory-only (sibling repo) |
| `mlops-reviewer`          | AI deploy + observability reviewer | directory-only                |
| `data-scientist-reviewer` | Prompt + eval reviewer             | directory-only                |

### Cross-cutting stewards (3)

| Slug                                | Role                               | Charter present |
| ----------------------------------- | ---------------------------------- | --------------- |
| `workspace-standardization-steward` | Package manifest normaliser        | yes (existing)  |
| `docs-adr-steward`                  | ADR + steering + contracts steward | yes (existing)  |
| `docs-changesets-steward`           | READMEs + changesets + CHANGELOGs  | yes (existing)  |

### Verify tier — reviewers + specialists (7)

| Slug                                 | Role                                 | Charter present |
| ------------------------------------ | ------------------------------------ | --------------- |
| `backend-architecture-reviewer`      | Laravel architecture reviewer        | yes (existing)  |
| `backend-platform-reviewer`          | Backend platform + release reviewer  | yes (existing)  |
| `container-di-architecture-reviewer` | DI + framework architecture reviewer | yes (existing)  |
| `package-api-release-reviewer`       | Package API surface reviewer         | yes (existing)  |
| `security-compliance-reviewer`       | Security + compliance reviewer       | yes (existing)  |
| `ui-design-a11y-reviewer`            | UI design + a11y reviewer            | yes (existing)  |
| `e2e-test-engineer`                  | Playwright + Detox E2E               | yes             |

### Verify tier — specialists (2)

| Slug                       | Role                             | Charter present |
| -------------------------- | -------------------------------- | --------------- |
| `performance-engineer`     | Lighthouse + k6 + bundle budgets | yes             |
| `accessibility-audit-lead` | WCAG 2.2 AA audit                | yes             |

### Ship tier (2)

| Slug              | Role                            | Charter present |
| ----------------- | ------------------------------- | --------------- |
| `release-manager` | Release cadence + version bumps | yes             |
| `deploy-engineer` | Canary + promote + rollback     | yes             |

### Operate tier (6)

| Slug                       | Role                                           | Charter present |
| -------------------------- | ---------------------------------------------- | --------------- |
| `sre-lead`                 | SLIs + SLOs + runbooks                         | yes             |
| `observability-engineer`   | Sentry + Grafana + tracing                     | yes             |
| `incident-commander`       | Sev1/Sev2 incident lead                        | directory-only  |
| `analytics-engineer`       | Analytics catalogue owner                      | directory-only  |
| `support-liaison`          | Support-to-engineering interface               | directory-only  |
| `legal-compliance-officer` | Regime-evidence owner (GDPR/FERPA/COPPA/SOC 2) | directory-only  |

## Task-to-agent mapping

The most common workflows and which agents each phase invokes. Every row is a
sub-agent invocation; every column is a phase.

### Ingesting a new project (Phase 0 → 3)

| Step                                           | Phase | Sub-agent(s)                                                        |
| ---------------------------------------------- | ----- | ------------------------------------------------------------------- |
| Convert PDF/DOCX brief to `brief.md`           | 0     | `spec-intake-analyst`                                               |
| Personas + JTBD + competitive matrix           | 1     | `stackra-product`, `ux-research-lead`, `market-research-analyst` |
| PRD + INVEST stories + v1/v2/later             | 2     | `stackra-product`                                                |
| Cross-cutting ADRs                             | 3     | `solution-architect`                                                |
| API contracts (`docs/contracts/*.schema.json`) | 3     | `api-contract-designer`                                             |
| ERD + row-attribution                          | 3     | `data-modeler`                                                      |
| STRIDE threat model                            | 3     | `threat-modeler`                                                    |
| IA + wireframes-as-markdown                    | 3     | `product-designer`, `content-designer`                              |

### Building a feature (Phase 4)

| Concern                                        | Sub-agent(s)                                    |
| ---------------------------------------------- | ----------------------------------------------- |
| Backend feature                                | `laravel-feature-builder` + `standards-steward` |
| Row-attribution audit on new tables            | `tenancy-compliance-auditor`                    |
| Backend tests + mutation coverage              | `test-mutation-engineer`                        |
| Frontend feature (web)                         | `heroui-ui-builder` + `code-standards-steward`  |
| Frontend feature (native)                      | `heroui-native-builder`                         |
| Framework-level primitive                      | `framework-core-builder`                        |
| Docblocks + JSDoc on new exports               | `code-documentation-writer`                     |
| Native-utility migration to `@stackra/support` | `support-utilities-steward`                     |
| i18n catalog scaffolding                       | `translator`                                    |
| AI-service endpoint                            | `python-service-builder`                        |
| Package-manifest normalisation                 | `workspace-standardization-steward`             |
| ADR authoring for design decisions             | `docs-adr-steward`                              |
| Changesets + CHANGELOG entries                 | `docs-changesets-steward`                       |

### Verifying a build (Phase 5)

| Concern                                   | Sub-agent                            |
| ----------------------------------------- | ------------------------------------ |
| Backend architecture correctness          | `backend-architecture-reviewer`      |
| Backend platform + release surface        | `backend-platform-reviewer`          |
| Container + DI + module lifecycle         | `container-di-architecture-reviewer` |
| Package API surface + tsup + exports maps | `package-api-release-reviewer`       |
| Security + privacy + minor consent        | `security-compliance-reviewer`       |
| UI design + component-level a11y          | `ui-design-a11y-reviewer`            |
| End-to-end (web + mobile)                 | `e2e-test-engineer`                  |
| Performance budgets                       | `performance-engineer`               |
| App-level WCAG 2.2 AA                     | `accessibility-audit-lead`           |
| Vitest suite strength                     | `vitest-test-engineer`               |
| Pest suite strength + mutation            | `test-mutation-engineer`             |
| Native suite strength                     | `native-test-engineer`               |
| Row-attribution across new tables         | `tenancy-compliance-auditor`         |

### Shipping (Phase 6)

| Step                              | Sub-agent         |
| --------------------------------- | ----------------- |
| Version bumps + changelog roll-up | `release-manager` |
| Deploy runbook + canary plan      | `deploy-engineer` |

### Operating (Phase 7)

| Signal                             | Sub-agent                  |
| ---------------------------------- | -------------------------- |
| SLI/SLO drift                      | `sre-lead`                 |
| Missing traces / alert noise       | `observability-engineer`   |
| Sev1 / Sev2 incident               | `incident-commander`       |
| Analytics catalogue drift          | `analytics-engineer`       |
| Ticket-to-bug conversion           | `support-liaison`          |
| DSAR / retention / regime evidence | `legal-compliance-officer` |

## Handoff chain — Day-0 to Day-90 walkthrough

The following narrative walks one small feature through the full pipeline. Every
step is one supervisor turn.

**Day 0.** A customer stakeholder emails a 40-page PDF describing what they
want. The supervisor invokes `spec-intake-analyst` with the PDF path. Rafael
emits
`.kiro/product/intake/<slug>/{brief.md,blueprint-draft.md, assumptions.md,reading-list.md}`.
Phase 0 closes.

**Day 2.** Ifeoma opens Phase 1. Supervisor invokes three sub-agents in
parallel: `stackra-product` (persona + JTBD synthesis), `ux-research-lead`
(user-interview plan), `market-research-analyst` (competitive matrix). Each
writes its artefact under `.kiro/product/intake/<slug>/`. Phase 1 closes.

**Day 5.** Rohan opens Phase 2. Supervisor invokes `stackra-product` alone.
PRD lands with locked v1 scope, INVEST stories, deferred v2/later. Phase 2
closes.

**Day 8.** Yuki opens Phase 3. Supervisor invokes five sub-agents in parallel:
`solution-architect` (ADRs), `api-contract-designer` (JSON schemas),
`data-modeler` (ERD), `threat-modeler` (STRIDE table), `product-designer` (IA +
wireframes-as-markdown). Every one writes to a disjoint tree. Phase 3 closes.

**Day 15.** Priya opens Phase 4. Supervisor invokes builders per lane in
parallel: backend + frontend web + frontend native + AI service. Each lane runs
its own steward-then-test-writer loop internally. Every closed lane ships
changesets via `docs-changesets-steward`. `pnpm build/typecheck/ test/lint`
green on every touched package. Phase 4 closes.

**Day 25.** Idris opens Phase 5. Supervisor invokes every reviewer in parallel
against the same build. Findings sort into P0/P1/P2/P3. All P0/P1 close before
Phase 6. Phase 5 closes.

**Day 28.** Salim opens Phase 6. Supervisor invokes `release-manager` (version
bumps + notes) then `deploy-engineer` (canary + promote plan). Phase 6 closes at
canary promotion.

**Day 30.** Farid opens Phase 7. On-call rotation active; observability signal
captured; incident-commander on standby. Phase 7 stays open for the life of the
feature.

**Day 90.** First quarterly review of the feature. Cross-agent audit runs the
reviewer verticals matrix (below). Any findings reopen a phase.

## Reviewer verticals matrix

Fifteen concerns; every concern has exactly one owner. Non-overlap is a
governance rule (`AGENT_ROSTER.md §VI.1`). If two reviewers file findings on the
same concern, `chief-orchestrator` routes to the owner and drops the duplicate.

| #   | Concern                                                            | Owner                                 |
| --- | ------------------------------------------------------------------ | ------------------------------------- |
| 1   | Laravel architecture correctness (actions-only, attribute DI)      | `backend-architecture-reviewer`       |
| 2   | Backend platform (queues, Octane, Doppler, Turborepo, CI, release) | `backend-platform-reviewer`           |
| 3   | Backend cross-cutting standards (steering, ADRs, docblock hygiene) | `standards-steward`                   |
| 4   | Row-level attribution (tenant_id / application_id / scope_node_id) | `tenancy-compliance-auditor`          |
| 5   | Docs (ADRs, steering, contracts)                                   | `docs-adr-steward`                    |
| 6   | Docs (READMEs, changesets, CHANGELOGs)                             | `docs-changesets-steward`             |
| 7   | Pest test suite strength + mutation                                | `test-mutation-engineer`              |
| 8   | Vitest test suite strength                                         | `vitest-test-engineer`                |
| 9   | Native Jest + Detox suite strength                                 | `native-test-engineer`                |
| 10  | Performance budgets (Lighthouse, k6, bundle)                       | `performance-engineer`                |
| 11  | App-level WCAG 2.2 AA                                              | `accessibility-audit-lead`            |
| 12  | Component-level UI design + a11y                                   | `ui-design-a11y-reviewer`             |
| 13  | Release engineering + deploy runbook                               | `release-manager` + `deploy-engineer` |
| 14  | DI / container / framework architecture                            | `container-di-architecture-reviewer`  |
| 15  | Package API surface + tsup + tree-shaking                          | `package-api-release-reviewer`        |

Plus two AI-service-specific concerns:

| #   | Concern                                             | Owner                     |
| --- | --------------------------------------------------- | ------------------------- |
| 16  | AI deploy + observability + canary                  | `mlops-reviewer`          |
| 17  | Prompt design + eval harnesses + statistical rigour | `data-scientist-reviewer` |

## Agent file organisation

Every charter follows the same shape. Copy-paste template lives in
`AGENT_ROSTER.md §Appendix B`; also see any existing charter in this folder for
a live example (`laravel-feature-builder.md`, `stackra-product.md` are the
canonical references).

### Required frontmatter fields

- `description` — one-line role summary. First 200 chars must convey the agent's
  scope so it renders in tool listings.
- `tools` — comma-separated list of tools the agent is allowed to invoke.
  Advisory agents (reviewers, leads) get `["read"]`; delegated agents that
  modify code get `["read", "write", "shell"]`.
- `includeMcpJson`, `includePowers` — usually `false`. Set only when the agent
  needs the workspace's MCP servers or installed Powers.

### Required sections

- **Role intro** — one paragraph. First person for advisory agents (leads,
  reviewers, planners); second person for delegated agents (builders, stewards).
- **Operating constraints (non-negotiable)** — hard rules; what this agent will
  never do.
- **Orient first** — numbered reading list. Steering docs, ADRs, existing code
  the agent must read before acting.
- **Scope you own** — bullet list of exact deliverables.
- **Explicitly out of scope** — bullet list; what other agents own.
- **Required output format** — how the agent's output must be shaped (markdown
  report, code diff, ADR draft, etc.).
- **Verify before done** — verification checklist the agent runs against its own
  output before returning.

### Cross-references every charter includes

- The agent's manager (matches persona dossier org chart).
- `AGENT_ROSTER.md §Phase-N` for phase context.
- Matrix relationships (dotted lines to cross-cutting stewards).
- Direct reports (for leads) or downstream handoffs (for specialists).

## Adding new agents

Every new agent lands in one commit with the following files touched:

1. **Charter** at `.kiro/agents/<slug>.md`. Follow the shape above.
2. **Persona** appended to `.kiro/product/agent-personas.md`. Full persona if
   the agent is leadership / flagship / marquee; lightweight directory entry
   otherwise.
3. **Roster row** appended to `AGENT_ROSTER.md §Part IV` under the correct
   phase.
4. **Roster row** appended to this file (`.kiro/agents/README.md`) under the
   correct tier table.
5. **ADR** at `docs/adr/<next>-<slug-or-rename>.md`. Renames and splits require
   an ADR (see `AGENT_ROSTER.md §VI.4`).
6. **Hook update** (optional): if the new agent introduces a new file-save
   trigger, add a matching hook under `.kiro/hooks/`.

### Naming rules

- Slugs are kebab-case, lowercase, and descriptive of the role (`data-modeler`,
  not `data`; `heroui-ui-builder`, not `builder`).
- Slugs never carry a level suffix (`v2`, `next`, `alt`).
- Renames land in the same commit that adds the ADR; no orphan aliases.

### Deleting an agent

Delete requires an ADR and a coordinated update across the four canonical
locations above (roster, dossier, README table, charter file). The persona
dossier keeps the entry marked as retired with a pointer to the successor.

## Related

- [`AGENT_ROSTER.md`](../../AGENT_ROSTER.md) — the master roster + pipeline
  plan.
- [`agent-personas.md`](../product/agent-personas.md) — the human-readable
  dossier for all 51 agents.
- [`docs/adr/0026-agent-canonical-directory.md`](../../docs/adr/0026-agent-canonical-directory.md)
  — the cross-repo canonical directory model.
- [`AGENT_QUICKSTART.md`](../../AGENT_QUICKSTART.md) — the two-minute onboard
  narrative for new supervisors.
- [`.kiro/hooks/`](../hooks/) — session-lifecycle hooks that keep this directory
  in sync with the dossier and the roster.
