# Agent directory

Kiro sub-agents that operate inside this repo. Each `.md` file in this folder is
a specialized agent with its own tools, orientation reading list, scope, and
required output shape.

Every agent orients against the repo's ground truth before acting:
[`AGENTS.md`](../../AGENTS.md),
[`docs/architecture.md`](../../docs/architecture.md),
[`docs/adr/`](../../docs/adr/), [`docs/contracts/`](../../docs/contracts/), and
every steering file under [`.kiro/steering/`](../steering/).

## The roster

Nine backend agents split into two rings: **reviewers** produce reports and
never modify code; **writers** modify code (or docs, or tests) in bounded,
verifiable ways.

### Reviewers (READ-ONLY, produce reports)

| Agent                                                               | Owns                                                                                                                                                                                                                                                                     | Report shape                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [`backend-architecture-reviewer`](backend-architecture-reviewer.md) | Actions-only architecture, attribute-driven discovery + DI, package boundaries, headless mandate, Octane-first DI correctness                                                                                                                                            | Findings / Naming & consistency / What's solid / Open questions                               |
| [`backend-platform-reviewer`](backend-platform-reviewer.md)         | Containers, Turborepo, CI/CD, Horizon, Octane runtime, Doppler mechanics, release-please                                                                                                                                                                                 | Findings / Naming & consistency / What's solid / Open questions                               |
| [`security-compliance-reviewer`](security-compliance-reviewer.md)   | Sanctum PATs + `service_accounts`, HS256 service JWT, RBAC (authorization vs access), tenancy isolation as a security property, Doppler secrets, minor consent + retention                                                                                               | Findings / Naming & consistency / What's solid / Open questions                               |
| [`standards-steward`](standards-steward.md)                         | Cross-cutting per-file compliance: docblocks, folder placement, attribute-first, data-first DTOs, column constants, console contract, testing layout, ADR-driven rules                                                                                                   | Findings (grouped by steering concern) / Naming & consistency / What's solid / Open questions |
| [`tenancy-compliance-auditor`](tenancy-compliance-auditor.md)       | Row-level attribution: `tenant_id` / `application_id` / `scope_node_id` column contract per `.kiro/steering/tenancy-columns.md` (the eight-row `application_id` list, `BelongsToTenant` trait presence, forbidden shortcut FKs, scope-consumer discipline, naming drift) | Summary / Violations / Warnings / Expected gaps / Passing checks                              |

### Writers (modify code / docs / tests, bounded scope)

| Agent                                                   | Writes                                                                                                                                                                                                                                                                         | Never writes                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`laravel-feature-builder`](laravel-feature-builder.md) | Features + packages + actions + Sanctum wiring + tenancy wiring                                                                                                                                                                                                                | Infrastructure / CI / auth policy                                                                                                                                                                                                               |
| [`codebase-housekeeper`](codebase-housekeeper.md)       | Mechanical compliance fixes only: docblocks, strict types, attribute migrations, column constants, folder moves, console-contract fixes                                                                                                                                        | Features, behaviour changes, tests (without approval)                                                                                                                                                                                           |
| [`docs-adr-steward`](docs-adr-steward.md)               | ADRs, steering files, top-level docs, cross-service JSON schemas                                                                                                                                                                                                               | Source code, migrations, CI workflows                                                                                                                                                                                                           |
| [`test-mutation-engineer`](test-mutation-engineer.md)   | Pest v4 tests + fixtures + factory states, Infection mutation runs                                                                                                                                                                                                             | Production code (surfaces bugs as findings, never fixes silently)                                                                                                                                                                               |
| [`translator`](translator.md)                           | Per-package frontend i18n catalogs — two JSON files per package at `packages/<pkg>/src/core/i18n/`: `en.json` (source of truth) + `ar.json` (machine-generated Modern Standard Arabic). Matches the `.ref/packages/i18n/` reference runtime's Vite plugin discovery convention | Any TypeScript, any interface, any register helper, any barrel edit, any manifest edit, existing component source, tests. Arabic is machine-generated and flagged in the scaffold report for a native Arabic-speaking reviewer pass before ship |

## Which agent for which task

Task-to-agent lookup. When multiple agents fit, invoke them in the listed order.

### Building

| Task                                                             | Agent(s)                                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Add a new endpoint (create/update/delete/show/list)              | `laravel-feature-builder`                                                                          |
| Add a new package under `packages/framework/`                    | `laravel-feature-builder` (implementation), then `docs-adr-steward` (docs + steering pointer)      |
| Add a new app under `apps/`                                      | `docs-adr-steward` (author the ADR justifying the new app first), then `laravel-feature-builder`   |
| Wire Sanctum PATs, service accounts, or the service JWT boundary | `laravel-feature-builder` — but ping `security-compliance-reviewer` for a review pass before merge |
| Add a new attribute + registry + bootstrapper trio               | `laravel-feature-builder`                                                                          |

### Cleaning

| Task                                                                           | Agent(s)                                                                                                       |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Bring an old module into compliance with current steering                      | `standards-steward` (audit) → `codebase-housekeeper` (fix)                                                     |
| Migrate `FormRequest` → Spatie `Data` classes                                  | `codebase-housekeeper` (mechanical), or `laravel-feature-builder` if the FormRequest carries non-trivial logic |
| Migrate `$fillable` / `$hidden` / `$table` properties to attributes            | `codebase-housekeeper`                                                                                         |
| Migrate raw column strings to `ATTR_*` constants                               | `codebase-housekeeper`                                                                                         |
| Move mislocated files (registry in `Support/` → `Registry/`, etc.)             | `codebase-housekeeper`                                                                                         |
| Migrate `Auth::user()` / `Log::info(...)` facade calls to container attributes | `codebase-housekeeper` (only when unambiguously safe)                                                          |

### Reviewing

| Task                                                                                                | Agent(s)                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pre-release full audit                                                                              | All five reviewers in parallel: `backend-architecture-reviewer`, `backend-platform-reviewer`, `security-compliance-reviewer`, `standards-steward`, `tenancy-compliance-auditor`                                                                        |
| "Is this PR safe to merge?" for a feature                                                           | `backend-architecture-reviewer` (structural), `standards-steward` (per-file), `security-compliance-reviewer` (if the diff touches auth / tenancy / secrets), `tenancy-compliance-auditor` (if the diff touches models / migrations / column constants) |
| "Is this PR safe to merge?" for infrastructure                                                      | `backend-platform-reviewer`                                                                                                                                                                                                                            |
| Verify the boundary contract still holds after schema changes                                       | `security-compliance-reviewer` + `docs-adr-steward`                                                                                                                                                                                                    |
| Audit `tenant_id` / `application_id` / `scope_node_id` column contract on a new module or migration | `tenancy-compliance-auditor`                                                                                                                                                                                                                           |

### Documenting

| Task                                                                                               | Agent(s)                                                                       |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Record a decision as an ADR                                                                        | `docs-adr-steward`                                                             |
| Update a steering file to reflect an ADR change                                                    | `docs-adr-steward`                                                             |
| Update the cross-service contract schemas under `docs/contracts/`                                  | `docs-adr-steward` (then flag both PHP + Python sides for coordinated updates) |
| Author or update `docs/architecture.md` / `docs/package-authoring.md` / `docs/domain-hierarchy.md` | `docs-adr-steward`                                                             |

### Testing

| Task                                                                         | Agent(s)                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Add feature + unit tests for a new action                                    | `test-mutation-engineer`                                                                    |
| Close coverage gaps in an existing module                                    | `test-mutation-engineer`                                                                    |
| Kill surviving Infection mutants                                             | `test-mutation-engineer`                                                                    |
| Write JWT conformance tests against `docs/contracts/service-jwt.schema.json` | `test-mutation-engineer` (writes tests), `security-compliance-reviewer` (verifies coverage) |

### Translating / localization

Frontend-only, targets `packages/*/src/` in the `academorix-frontend` monorepo.
The `translator` operates alongside `code-standards-steward` (file layout),
`code-documentation-writer` (docblocks), and `contract-reexports.md` (imports
`I18nTranslation` from `@stackra/contracts` directly — never re-exports).

| Task                                                                                                             | Agent(s)                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Audit a package for translatable strings (component defaults, JSX text, `aria-label`, `placeholder`, label maps) | `translator` (audit mode)                                                                                         |
| Scaffold a per-package i18n catalog (two JSON files: `en.json` + `ar.json` under `src/core/i18n/`)               | `translator` (scaffold mode)                                                                                      |
| Verify a machine-generated Arabic catalog before shipping                                                        | Human native-speaker reviewer — the `translator` marks every uncertain entry with a `// review: <note>` comment   |
| Add a new locale beyond `en` / `ar` to an existing package                                                       | `translator` (scaffold mode, targeted at the single package) — updates `SUPPORTED_LOCALES` + adds the new catalog |
| Migrate a component from a hard-coded default (`title = "..."`) to a `t(...)` call once the runtime lands        | `framework-core-builder` or `heroui-ui-builder` — NOT the translator (component-source lane)                      |
| Build the `@stackra/i18n` runtime package (`I18nManager`, `LocaleService`, direction adapter)                    | `framework-core-builder` — NOT the translator (runtime lane)                                                      |

## Handoff chains

Common multi-agent workflows.

### Ship a new feature end-to-end

```
laravel-feature-builder (implement)
   ↓
test-mutation-engineer (feature + unit + mutation tests)
   ↓
standards-steward (per-file audit)
   ↓
backend-architecture-reviewer (structural audit)
   ↓
security-compliance-reviewer (if auth / tenancy / secrets touched)
   ↓
docs-adr-steward (if a decision needs recording)
```

### Rehabilitate a legacy module

```
standards-steward (audit — produces the findings list)
   ↓
codebase-housekeeper (mechanical fixes for P0 → P1 → P2 → P3)
   ↓
laravel-feature-builder (non-mechanical remediation: Service → Action, etc.)
   ↓
test-mutation-engineer (add tests that pin the new behaviour)
   ↓
standards-steward (second pass — confirm compliance)
```

### Land a new architectural decision

```
docs-adr-steward (write the ADR + update steering)
   ↓
laravel-feature-builder (implement the decision)
   ↓
test-mutation-engineer (test the invariants the ADR pins)
   ↓
standards-steward (audit that consumers follow the new rule)
```

## Reviewer verticals — no overlap by design

The five reviewers own strictly disjoint lanes. When a finding sits at the
boundary, the owning reviewer flags it and defers with a pointer — never
double-audits.

| Concern                                                                                                                                    | Owner                           |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Actions-only architecture, attribute discovery, package boundaries, headless mandate                                                       | `backend-architecture-reviewer` |
| Containers, Turborepo, CI, Horizon, Octane runtime, Doppler mechanics                                                                      | `backend-platform-reviewer`     |
| Sanctum, service JWT, RBAC, tenancy isolation as a security property, secrets, minor consent                                               | `security-compliance-reviewer`  |
| Per-file compliance: docblocks, folder placement, attribute-first, data-first, column constants, console contract, testing layout          | `standards-steward`             |
| Row-level attribution: `tenant_id` / `application_id` / `scope_node_id` column contract; forbidden shortcut FKs; scope-consumer discipline | `tenancy-compliance-auditor`    |

The `docs-adr-steward` is orthogonal — it works alongside every reviewer,
translating findings that warrant a rule into ADRs + steering.

## What lives in `.ref/agents/`

The [`../../.ref/agents/`](../../.ref/agents/) directory carries source-of-truth
copies for agents that span both this repo AND the `academorix-ai` sibling.
Backend-only variants live here; AI-only variants (`data-scientist-reviewer`,
`devops-platform-reviewer`, `mlops-reviewer`, `python-service-builder`) are
consumed directly from `.ref/` by the AI repo's agent runtime.

Do not edit files under `.ref/agents/` from this repo — those are cross-repo
sources of truth. Edit the backend-specific copies here in `.kiro/agents/`.

## Agent file shape

Every agent follows the same frontmatter + section shape:

```yaml
---
description: >-
  One-paragraph summary the runtime uses to route tasks.
tools: ["read", "shell"] # or ["read", "write", "shell"]
---
You are a <role>...
## Operating constraints
## Orient first
## Scope you own
## Explicitly out of scope (defer to sibling reviewers)
## Required output format
```

Writers add `## Verify before done` and `## Required output` (vs "output
format"). Read any existing agent file for the canonical shape.

## Adding a new agent

1. Copy the closest existing agent (reviewer vs writer) as the template.
2. Set `tools:` — `["read", "shell"]` for reviewers,
   `["read", "write", "shell"]` for writers.
3. Fill the Orient section with the specific steering + ADR references the agent
   depends on.
4. Cite lanes owned + lanes deferred so no overlap with sibling agents.
5. Add a row to this README's roster + relevant task-to-agent tables.
6. If the agent codifies a genuinely new lane, write an ADR (`docs-adr-steward`
   can help) so the decision is recorded.
