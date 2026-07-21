# `modules/shared/` — universal blueprints

Nine modules that **every deployable service consumes**. They are not tied to
any single platform service — foundation is imported by identity-service AND
platform-service AND every other service; audit is written to by every service;
etc.

Because these modules cross service boundaries, they ship as **shared Composer
packages** rather than as modules embedded in a service's `src/modules/`. The
backend imports them via `require`, not via a service-local module scaffold.

| Module                                      | Wave | Priority | Schemas | Purpose                                                                                                                                                              |
| ------------------------------------------- | ---- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`foundation/`](./foundation/readme.md)     | 0    | 0        | 0       | The platform substrate — HTTP primitives, base traits, base migrations, module discovery, health aggregator, migration macros. Every downstream module extends this. |
| [`versioning/`](./versioning/readme.md)     | 1    | 12       | 2       | Public-interface versioning — REST, payload, webhook, GraphQL. Owns `ApiVersion` + `DeprecationNotice` (RFC 8594 Sunset workflow).                                   |
| [`telemetry/`](./telemetry/readme.md)       | 1    | 12       | 0       | Three-signal observability — traces + metrics + logs (OTel + Monolog).                                                                                               |
| [`audit/`](./audit/readme.md)               | 2    | 20       | 1       | Compliance-grade audit trail with cryptographic hash chain. Every service writes to its own `audits` table via `HasAuditable`.                                       |
| [`activity/`](./activity/readme.md)         | 2    | 20       | 1       | Per-tenant product feed. Softer semantics than audit — human-readable.                                                                                               |
| [`transfer/`](./transfer/readme.md)         | 3    | 23       | 4       | Import + export operations (bulk + streaming). Consumers implement `#[Transferable]`.                                                                                |
| [`search/`](./search/readme.md)             | 5    | 30       | 5       | Full-text + vector search substrate. Consumers implement `HasSearchable`.                                                                                            |
| [`geography/`](./geography/readme.md)       | 5    | 30       | 6       | Reference geo (countries, states, cities, timezones, currencies) + IP geolocation.                                                                                   |
| [`localization/`](./localization/readme.md) | 5    | 30       | 4       | `spatie/laravel-translatable` wrapper + drivers. Publishes `HasTranslations` + `#[Translatable]`.                                                                    |

**Total: 9 modules, 23 schemas.**

## Why "shared" is not a service

Every other tier maps 1:1 to a Laravel service deployment. `shared/` doesn't —
it's a **package tier**. The modules here compile into `stackra/*` Composer
packages that every service `require`s. Concretely:

- `foundation`, `versioning`, `telemetry` → depended on by every service.
- `audit`, `activity` → each service has its OWN `audits` / `activity_log`
  tables; the shared package ships the trait (`HasAuditable`, `HasActivityLog`)
  that writes to them. **There is no shared audit service** — that would be a
  cross-tenant read hazard.
- `transfer`, `search`, `geography`, `localization` → substrate packages
  services opt into as needed.

## Cross-cutting invariants

- **Every module below Wave 5 depends on `foundation`.** The validator enforces
  strict boot-order priority.
- **`audit` + `activity` never become services.** They're behavioural traits
  every service exhibits, not domains a service owns.
- **`shared/` modules NEVER depend on modules in another tier.** They sit at the
  bottom of the DAG — nothing consuming them can consume back.

## Adding a shared module

Before adding a module here, ask: _"Does every service consume this?"_ If yes →
`shared/`. If it fits under a specific service's responsibility → its service
tier. If it's product-specific (only Sports needs it) → `products/`.

## For agents

- The **`foundation`** module is where every cross-cutting primitive lives —
  read its `readme.md` first when unfamiliar. It hosts the ULID prefix registry
  (`data/ulid-prefixes.json`), the module-graph validator
  (`scripts/validate-module-graph.py`), and the module-graph DOT
  (`data/module-graph.dot`) that render the whole tree.
- **Never write a trait that duplicates a shared module.** Search
  `shared/*/traits.json` first — 90% of the time, the trait already exists.
- Every trait declared here has an `@usedBy` list in its `traits.json`. Update
  it in the same commit that adds a consumer.

## Related

- `../README.md` — master index.
- `.kiro/steering/hierarchy.md` §6 — module responsibility map.
- `.kiro/steering/priority-ordering.md` — the wave convention.
- `.kiro/steering/discovery.md` — the `DiscoversAttributes` contract every
  package resolves.
