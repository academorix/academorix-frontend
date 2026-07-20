# Agents Tasks

Recreate the full agent roster: 51 agents, 8-phase pipeline plan, persona
dossier, hooks, and the canonical-directory ADR.

**File-tree ownership**: `AGENT_ROSTER.md`, `.kiro/agents/**`,
`.kiro/product/agent-personas.md`, `.kiro/hooks/**`,
`docs/adr/0026-agent-canonical-directory.md`. Never touch anything else.

**No git operations.**

---

## 1. `AGENT_ROSTER.md` at workspace root

Master Day-0 → Day-90 pipeline plan. ~1,000 lines.

### Structure

- **Executive summary** — one-paragraph mission statement + reality check ("Kiro
  provides sub-agents + hooks; hub-and-spoke, not swarm").
- **Part I — Kiro coordination primitives**
  - `invoke_sub_agent` — hub-and-spoke, parallel-capable
  - Hooks — event-triggered reactive layer
  - File-based state (trackers + reports as shared blackboard)
- **Part II — 8-phase pipeline** (see below)
- **Part III — Organizational model**
  - Chief Orchestrator + 4 team leads + 3 cross-cutting stewards
  - Reporting lines
- **Part IV — Full 51-agent roster** (by phase)
- **Part V — Orchestration mechanics**
- **Part VI — Governance rules** (non-overlap, artifact ownership, single source
  of truth)
- **Part VII — Enterprise readiness lanes** (security, compliance, SRE, DR)
- **Part VIII — Rollout plan** (which agents to build first)
- **Appendices** — A-to-Z index, task tracking, steering references, glossary

### The 8-phase pipeline (verbatim from fullplan.md)

```
Phase 0. INTAKE           spec-intake-analyst
   ↓                       (PDF/MD/DOCX → structured brief.json)
Phase 1. DISCOVERY        academorix-product + ux-research-lead + market-research-analyst
   ↓                       (personas, JTBD, competitive matrix, opportunity brief)
Phase 2. DEFINITION       academorix-product
   ↓                       (PRD, INVEST stories, v1/v2/later scope)
Phase 3. DESIGN           solution-architect + api-contract-designer + data-modeler
                          + threat-modeler + product-designer + content-designer
   ↓                       (ADRs, OpenAPI/JSON schemas, ERD, threat model, IA)
Phase 4. BUILD (fan out)
                          Backend lane:     laravel-feature-builder → standards-steward
                                            → tenancy-compliance-auditor → test-mutation-engineer
                          Frontend web:     framework-core-builder + heroui-ui-builder
                                            → code-standards-steward + code-documentation-writer
                                            + support-utilities-steward + translator
                                            → vitest-test-engineer
                          Frontend native:  heroui-native-builder → native-test-engineer
                          AI service:       python-service-builder → mlops-reviewer
                                            + data-scientist-reviewer
                          Cross-cutting:    workspace-standardization-steward,
                                            docs-adr-steward, docs-changesets-steward
   ↓
Phase 5. VERIFY           All reviewers in parallel + e2e-test-engineer,
                          performance-engineer, accessibility-audit-lead
   ↓                       (gates go/no-go for release)
Phase 6. SHIP             release-manager → deploy-engineer
   ↓                       (tag, publish, canary, promote, rollback plan)
Phase 7. OPERATE          sre-lead + observability-engineer + incident-commander
                          + analytics-engineer + support-liaison + legal-compliance-officer
```

### Frontmatter

```yaml
---
title: Academorix Agent Roster & Pipeline Plan
status: v1.0 adopted
version: 1.0
last_updated: 2026-07-20
---
```

### Line target

~1,029 lines. Prose density: match the technical clarity of
`.kiro/steering/*.md` files. No emojis. No exclamation marks.

---

## 2. `.kiro/product/agent-personas.md`

LinkedIn-ready persona dossier for all 51 agents. ~1,272 lines.

### Frontmatter

```yaml
---
title: Academorix Agent Personas — Team Dossier
status: adopted
tranche: complete
total_personas: 51
last_updated: 2026-07-20
review_gates_cleared:
  - tone
review_gates_deferred:
  - name-conflict-screening (only 8/51 screened this session)
  - portrait-consistency (portraits not generated)
---
```

### Structure

- **Intro** — purpose, how to use, naming convention, tone rules
  (LinkedIn-corporate baseline; tuned per role — leads have gravitas, reviewers
  are precise, builders are technical, designers are warmer)
- **Table of contents**
- **Org chart** — ASCII, Chief Orchestrator at top → 4 verticals + 3
  cross-cutting stewards + AI-service sibling
- **Persona template** — copy-paste shape for future additions

### Persona shape (per persona)

Every full persona has these fields:

- Agent slug (maps to `.kiro/agents/<slug>.md`)
- Name (real-sounding, diverse, non-cringe)
- Role headline (one LinkedIn-style line)
- Reports to
- Manages (for leads)
- Phase(s) they own
- Bio (2–3 sentences, first-person)
- Expertise (5–6 bullets)
- Signature stack (5–6 tools)
- Pinned post (60–120 words, publish-verbatim on LinkedIn)
- Portrait brief (age range, ethnicity cue, wardrobe, setting, expression,
  lighting, vibe one-liner)

### Tranche 1 — Leadership (8 full personas)

Same lock-in from fullplan.md:

| Slug               | Name              | Role                         |
| ------------------ | ----------------- | ---------------------------- |
| chief-orchestrator | Karim Al-Mansouri | Head of Engineering Delivery |
| product-lead       | Ifeoma Adekunle   | Product Lead                 |
| design-lead        | Yuki Nakamura     | Design Lead                  |
| delivery-lead      | Priya Iyer        | Delivery Lead                |
| quality-lead       | Idris Benyamin    | Quality Lead                 |
| security-lead      | Fatima Al-Rashid  | Security Lead                |
| data-lead          | Kwame Boateng     | Data Lead                    |
| docs-lead          | Inês Cordeiro     | Docs Lead                    |

### Tranche 2 — Flagship builders (5 full personas)

| Slug                    | Name            | Role                                 |
| ----------------------- | --------------- | ------------------------------------ |
| spec-intake-analyst     | Rafael Mendes   | Product Analyst · Intake & Discovery |
| academorix-product      | Rohan Kapoor    | Product Manager · Enterprise         |
| laravel-feature-builder | Hicham El-Fassi | Senior Backend Engineer              |
| heroui-ui-builder       | Isla Bennett    | Senior Frontend Engineer             |
| python-service-builder  | Linh Nguyen     | AI Service Engineer                  |

### Tranche 3 — Marquee reviewers (2 full personas)

| Slug                          | Name            | Role                        |
| ----------------------------- | --------------- | --------------------------- |
| security-compliance-reviewer  | Camila Restrepo | Senior Security Reviewer    |
| backend-architecture-reviewer | Rahel Mekonnen  | Principal Backend Architect |

### Directory (36 lightweight entries)

Every remaining agent gets: name + role + agent slug + one-line bio +
reports-to. Grouped under 6 section headers (by manager):

- Under Yuki (Design Lead) — 5 agents
- Under Priya (Delivery Lead) — 8 agents
- Under Idris (Quality Lead) — 13 agents
- Under Inês (Docs Lead) — 2 agents
- Under Karim (Ship + Ops direct) — 4 agents
- Under AI-service lead — 3 agents

### Distribution targets

- MENA / North African: ~35% (~18/51)
- South Asian: ~20% (~10)
- European: ~15% (~8)
- East Asian: ~10% (~5)
- African: ~10% (~5)
- Latin American: ~10% (~5)
- Gender: ~50/50 with 2–3 intentionally gender-ambiguous first names

### Real-world name conflicts (already caught in fullplan.md, keep the fixes)

- **Ifeoma Adekunle** was originally "Adaeze Okonkwo" — swap because
  `adaezeokonkwo.com` is a live personal site
- **Rahel Mekonnen** was originally "Selam Tesfaye" — swap because Selam Tesfaye
  is a well-known Ethiopian actress with a Wikipedia page

---

## 3. `.kiro/agents/README.md`

Full 51-agent roster tabulated by tier. ~437 lines.

### Structure

- Intro — purpose of the directory, how to invoke agents
- Full roster table — 51 agents by tier (executive · vertical leads ·
  cross-cutting stewards · product · design · build · quality · docs · ship +
  ops · AI service)
- Task-to-agent mapping tables — for common workflows:
  - Ingesting a new project (Phase 0 → 3)
  - Product work (Phase 1–2)
  - Design work (Phase 3)
  - Build work (Phase 4 by lane)
  - Shipping (Phase 6)
  - Operating (Phase 7)
- Handoff chain — Day-0 → Day-90 full-feature ship walkthrough
- Reviewer verticals matrix — 15 owners across architecture, security,
  standards, tenancy, docs, tests, performance, a11y, mobile, release, platform,
  DI/container, package API/release, data-science, MLOps
- Agent file organization — what fields every charter contains
- Cross-repo strategy — points at ADR-0026
- Adding new agents — checklist

---

## 4. The 21 new agent charter files under `.kiro/agents/`

Every charter follows the canonical shape (match the format of
`.kiro/agents/laravel-feature-builder.md` and
`.kiro/agents/academorix-product.md` which already exist in the workspace):

```markdown
---
description: <one-line description>
tools: <comma-separated tool list>
includeMcpJson: false
includePowers: false
---

# <Agent Name>

<Role intro — one paragraph. First-person for advisory agents, second-person for
delegated agents.>

## Operating constraints (non-negotiable)

- <hard rules>
- <what this agent will never do>

## Orient first

Read these before doing anything:

- `<path>`
- `<path>`

## Scope you own

- <bullet list of exact deliverables>

## Explicitly out of scope

- <bullet list — what other agents own>

## Required output format

<how output must be shaped>

## Verify before done

<verification checklist>
```

### The 21 files

**Leadership tier (8):**

- `chief-orchestrator.md`
- `product-lead.md`
- `design-lead.md`
- `delivery-lead.md`
- `quality-lead.md`
- `security-lead.md`
- `data-lead.md`
- `docs-lead.md`

**Discovery + Design tier (6):**

- `spec-intake-analyst.md` — flagship agent; takes PDFs/MD/DOCX and emits
  `.kiro/product/intake/<slug>/{brief.md,blueprint-draft.md, assumptions.md,reading-list.md}`.
  Output must match `.ref/DOMAIN_MODULES_BLUEPRINT.md` shape.
- `solution-architect.md` — pre-code ADRs; consumes intake brief
- `api-contract-designer.md` — writes `docs/contracts/*.schema.json` + OpenAPI
  fragments before implementation
- `data-modeler.md` — owns ERDs, column contracts, migration order; enforces
  `tenant_id` / `application_id` / `scope_node_id` early
- `threat-modeler.md` — STRIDE + attack tree at design phase; emits threat-model
  doc that `security-compliance-reviewer` verifies later
- `product-designer.md` — IA, user flows, wireframes-as-markdown; emits screen
  contracts

**Verify tier (3):**

- `e2e-test-engineer.md` — Playwright (web) + Detox (mobile)
- `performance-engineer.md` — Lighthouse, k6, bundle budgets
- `accessibility-audit-lead.md` — axe-core, WCAG 2.2 AA audit

**Ship tier (2):**

- `release-manager.md` — orchestrates version bumps + release notes
- `deploy-engineer.md` — IaC + canary/promote/rollback

**Operate tier (2):**

- `sre-lead.md` — SLIs/SLOs, runbooks, on-call
- `observability-engineer.md` — Sentry, Grafana, tracing

### Cross-references in every charter

- Names the agent's manager (matches persona-dossier org chart)
- References `AGENT_ROSTER.md §Phase-N` for phase context
- Names matrix relationships (dotted lines to cross-cutting stewards)
- Names direct reports (for leads) or downstream handoff (for specialists)

---

## 5. `docs/adr/0026-agent-canonical-directory.md`

Cross-repo canonical directory strategy. ~200 lines.

### Frontmatter

```yaml
---
number: 0026
title: Agent canonical directory model
status: accepted
date: 2026-07-20
---
```

### Content

- **Context** — Same agent files exist in three trees today (`.kiro/agents/`,
  `.ref/agents/`, sibling repo `.kiro/agents/`). Cross-repo drift is a real
  risk.
- **Decision** — Three-tier canonical directory model:
  1. Truly cross-repo agents live in `academorix/.kiro/agents/` (parent of all
     repos), sub-repos symlink
  2. Repo-specific agents live in their repo's `.kiro/agents/`
  3. Reference-only copies in `.ref/agents/` (git-ignored)
- **Migration plan** — Which agents move to the canonical parent
- **Rollout timeline** — Two-week window
- **Reversibility** — Symlinks can be inverted; no data loss
- **Alternatives considered** — 4 alternatives with why-not

### Cross-file consistency

Add a line to `AGENT_ROSTER.md` §I.5 pointing at this ADR. Add a paragraph to
`.kiro/agents/README.md` under "Cross-repo strategy".

---

## 6. Kiro hooks — 4 JSON files under `.kiro/hooks/`

Use the `createHook` tool for each. All actionType = `agent` (inject prompt,
don't run shell).

### 6.1 `agent-roster-session-orient.json`

- **trigger**: `SessionStart`
- **name**: `Agent Roster — Session Orient`
- **prompt**: Reminds the agent to read `AGENT_ROSTER.md` +
  `AGENT_QUICKSTART.md` before invoking any sub-agent

### 6.2 `agent-file-sync-reminder.json`

- **trigger**: `PostFileSave`
- **matcher**: `\.kiro/agents/.*\.md$`
- **name**: `Agent Charter Save — Sync Reminder`
- **prompt**: Reminds to update `.kiro/agents/README.md`,
  `.kiro/product/agent-personas.md` org chart, and `AGENT_ROSTER.md` §IV roster
  table if the charter is new or renamed

### 6.3 `persona-dossier-sync-reminder.json`

- **trigger**: `PostFileSave`
- **matcher**: `\.kiro/product/agent-personas\.md$`
- **name**: `Persona Dossier Save — Org Chart Sync`
- **prompt**: Cross-doc consistency check — the org chart in the dossier must
  match `AGENT_ROSTER.md`'s org chart

### 6.4 `adr-save-steering-reminder.json`

- **trigger**: `PostFileSave`
- **matcher**: `docs/adr/.*\.md$`
- **name**: `ADR Save — Steering Sync Reminder`
- **prompt**: Reminds to update `.kiro/steering/*.md` if the ADR changes an
  architectural rule

---

## Verify

```sh
# Roster + dossier + README exist and have the target sizes
wc -l AGENT_ROSTER.md .kiro/product/agent-personas.md .kiro/agents/README.md
# AGENT_ROSTER.md ≈ 1029 lines
# agent-personas.md ≈ 1272 lines
# .kiro/agents/README.md ≈ 437 lines

# 21 new charters landed
ls -1 .kiro/agents/{chief-orchestrator,product-lead,design-lead,delivery-lead,\
quality-lead,security-lead,data-lead,docs-lead,spec-intake-analyst,\
solution-architect,api-contract-designer,data-modeler,threat-modeler,\
product-designer,e2e-test-engineer,performance-engineer,\
accessibility-audit-lead,release-manager,deploy-engineer,sre-lead,\
observability-engineer}.md 2>&1 | grep -c '^\.kiro'   # → 21

# ADR-0026 exists
ls -la docs/adr/0026-agent-canonical-directory.md

# 4 hooks exist
ls .kiro/hooks/{agent-roster-session-orient,agent-file-sync-reminder,\
persona-dossier-sync-reminder,adr-save-steering-reminder}.json 2>&1 | grep -c '\.json$'   # → 4

# Zero references to the two renamed personas anywhere
grep -rn "Adaeze Okonkwo\|Selam Tesfaye" --include='*.md' AGENT_ROSTER.md \
  .kiro/agents .kiro/product .kiro/hooks docs/adr 2>/dev/null || echo '(clean)'
```

---

## Source of truth

`fullplan.md` — search for "AGENT_ROSTER.md", "agent-personas.md", "Ifeoma
Adekunle", "Rahel Mekonnen", "ADR-0026". Every specific decision already made in
fullplan.md is authoritative; do not deviate.
