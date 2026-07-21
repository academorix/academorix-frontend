# `modules/` — Stackra blueprint index

**Read this first.** Every artefact under `modules/` is a _blueprint_ — a set of
language-neutral JSON manifests that declare a bounded context (schemas, traits,
attributes, relations, events, jobs, retention, wire contracts). The runtime
code that satisfies these blueprints lives in the sibling
[`stackra-backend`](https://github.com/) repo under
`apps/<service>-service/src/modules/<module>/`. Blueprints are the source of
truth for both codebases: the backend generates against them, the frontend
type-generates SDKs from them.

## What lives here

- **The blueprints** — one folder per module, uniform shape (see
  `.kiro/specs/module-blueprints/PLAN.md` §3).
- **The module graph** — dependency + boot-order truth at
  `shared/foundation/data/module-graph.dot`.
- **The ULID prefix registry** — global uniqueness at
  `shared/foundation/data/ulid-prefixes.json`.
- **The validator** — `shared/foundation/scripts/validate-module-graph.py`.

Nothing under `modules/` is executable Laravel/PHP code. The backend consumes
these blueprints to scaffold Composer packages; a JSON edit here changes what
the backend must generate.

## Tier map

Modules are grouped by the **deployable service** they land in. This mirrors the
platform-shape decision in `.kiro/specs/platform-architecture/DECISION.md` §4.

| Tier                                          | Deploys to              | Modules         | Purpose                                                                                                                    |
| --------------------------------------------- | ----------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [`shared/`](./shared/README.md)               | every service           | 9               | Consumed by every service — foundation, telemetry, audit, activity, versioning, transfer, search, geography, localization. |
| [`identity/`](./identity/README.md)           | `identity-service`      | 0 (planned: 5)  | One credential per human, MFA, OAuth clients, service accounts, JWKS.                                                      |
| [`platform/`](./platform/README.md)           | `platform-service`      | 8               | Tenancy + config hierarchy: application, tenants, domains, branding, integrations, settings, webhook, storage.             |
| [`access/`](./access/README.md)               | `access-service`        | 1 (planned: +3) | Authorization vocabulary: invitations (now); access/scope/groups (planned).                                                |
| [`billing/`](./billing/README.md)             | `billing-service`       | 2               | Money + entitlements — subscription, entitlements.                                                                         |
| [`notifications/`](./notifications/README.md) | `notifications-service` | 6               | Fan-out hub: core + mail/sms/push/in-app transports + newsletter.                                                          |
| [`compliance/`](./compliance/README.md)       | `compliance-service`    | 1               | Cross-service orchestrator: DSAR, retention, legal hold, subprocessors, safeguarding.                                      |
| [`products/`](./products/README.md)           | product monoliths       | 1               | Domain-specific modules consumed by product apps: geofencing.                                                              |

**Total on disk: 28 modules.** Names are **globally unique** — every
`dependencies` / `extendedBy` / `planned_consumers` / `relations.json target`
across every module is a bare basename that resolves regardless of tier.

## Module folder shape (uniform)

Every `modules/<tier>/<name>/` folder contains the same set of JSON manifests
plus one markdown readme. Empty artefacts are allowed — a module that ships no
jobs still has `jobs.json` with a meaningful description and `"jobs": []`.

Key files (full contract in `.kiro/specs/module-blueprints/PLAN.md` §3):

| File                                                                                 | Purpose                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `module.json`                                                                        | Descriptor: identity, priority, dependencies, contributes, hosts.                    |
| `readme.md`                                                                          | Human overview of the module.                                                        |
| `changelog.md`                                                                       | Version log per module.                                                              |
| `schemas/<entity>.schema.json`                                                       | JSON Schema per entity + `x-eloquent` + `x-database` + `x-wire`.                     |
| `traits.json`                                                                        | Owned + consumed model traits.                                                       |
| `attributes.json`                                                                    | PHP attributes the module contributes.                                               |
| `relations.json`                                                                     | Cross-module Eloquent relations.                                                     |
| `routes.json`                                                                        | HTTP surface by host audience.                                                       |
| `events.json` / `listeners.json` / `observers.json` / `hooks.json`                   | Async wiring.                                                                        |
| `jobs.json` / `schedule.json` / `commands.json` / `notifications.json`               | Async surface.                                                                       |
| `policies.json` / `permissions.json` / `features.json` / `entitlements.json`         | Governance.                                                                          |
| `health.json` / `metrics.json` / `analytics.json` / `caches.json` / `retention.json` | Operational.                                                                         |
| `contracts/<event>.v<n>.json`                                                        | Frozen wire contracts (cross-service events).                                        |
| `sdui/**`                                                                            | Server-driven UI blueprints (screens, forms, widgets).                               |
| `data/**`                                                                            | Fixtures + registry files (ULID prefix registry lives in `shared/foundation/data/`). |

## Discovery + validation

Every consumer resolves modules via one contract — `discover_modules()` in the
validator walks `modules/**/module.json` and keys by the module's own basename
(not its path). That means:

- **You can move a module between tiers without editing any cross-reference.**
- **You cannot have two modules with the same basename** — the validator refuses
  hard.

Run the validator before every commit that touches this tree:

```bash
python3 modules/shared/foundation/scripts/validate-module-graph.py
```

Five checks: dependency existence, `extendedBy` existence, boot-order priority
monotonicity, ULID prefix registry completeness, rename traceability. Green =
safe to merge; red = fix before proceeding.

## Boot-order (waves)

Modules boot in **wave order** — every dependency finishes booting before its
consumer starts. Lower priority = earlier wave.

- **Wave 0** (`priority=0`): `foundation`
- **Wave 1** (`priority=10-12`): `tenants`, `versioning`, `telemetry`
- **Wave 2** (`priority=20-22`): `audit`, `activity`, `settings`,
  `notifications`
- **Wave 3** (`priority=22-29`): `entitlements`, `webhook`, `transfer`,
  `storage`, `invitations`, `subscription`, transports (26)
- **Wave 5** (`priority=30`): `search`, `geography`, `geofencing`,
  `localization`, `compliance`
- **Wave 6** (`priority=35+`): domain-shaped surfaces (`newsletter`)

Full detail + rationale in `.kiro/steering/priority-ordering.md` and
`.kiro/steering/module-graph.md`.

## For agents

**Start here** when picking up work on this tree:

1. Read this file.
2. Read the tier README for the module you're touching
   (`modules/<tier>/README.md`).
3. Read the module's own `readme.md` and `module.json`.
4. Read the relevant steering docs (linked at the bottom of each tier README).
5. Run the validator to confirm your starting state is green.
6. Make your edit.
7. Run the validator again.

**Never** edit a module folder without first reading its `readme.md` — the
readme carries the invariants the JSON manifests only imply.

## Related

- `.kiro/specs/platform-architecture/DECISION.md` — 6-service topology + why.
- `.kiro/specs/module-blueprints/PLAN.md` — per-module blueprint contract (§3).
- `.kiro/specs/platform-service-implementation/README.md` — the first
  service-build plan (Platform is the pilot).
- `.kiro/steering/hierarchy.md` — canonical platform tree + terminology.
- `.kiro/steering/tenancy-columns.md` — the three-axes column contract.
- `.kiro/steering/module-graph.md` — dependency graph reader's guide.
- `.kiro/steering/priority-ordering.md` — the wave / priority convention.
- `.kiro/steering/ulid-prefix-registry.md` — how to add + rename ULID prefixes.
- `.kiro/steering/module-partitioning.md` — when to extract vs keep together
  (3-test rule).
