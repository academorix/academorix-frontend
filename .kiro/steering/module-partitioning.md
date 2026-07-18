---
inclusion: manual
---

# Module partitioning — when to extract, when to keep together

The rule that governs how blueprints under `modules/<tier>/<name>/` are
partitioned. Applies both at greenfield authoring time and to retrospective
splits like the platform v0.3 workspaces extraction.

**Read this before adding a new module. Read it again before extracting entities
from an existing module.** Wrong partitioning cost — a mega-module that changes
for four different reasons, or a swarm of trivial modules that always deploy
together — is expensive to reverse once code is written on top of the
blueprints.

## The 3-test — should this entity live in its own module?

An entity earns its own module if **at least two** of the following are true.
One test = leave with its neighbours. Two or three = extract.

### Test 1 — Different lifecycle

The entity's mutation frequency, immutability, verification workflows, cert
rotation, or dedicated background jobs are materially different from its
neighbours.

Examples of yes:

- `Domain` has multi-hour DNS verification round-trips and cert renewals on a
  30-day schedule; `Workspace` has none.
- `Branding` mutates on-demand from the workspace owner; `Application` changes
  once per product launch.

Examples of no:

- `WorkspaceContact` mutates whenever `Workspace` mutates — same lifecycle.

### Test 2 — Different consumer set

The entity is consumed by a materially different subset of services, or by
subjects with materially different access permissions.

Examples of yes:

- `Application` is consumed by every service (product routing everywhere);
  `Workspace` is consumed by tenant-scoped services only.
- `Branding` is read by every render path (SPA, marketing, email, OG); most
  workspace entities are read by admin-only paths.

Examples of no:

- `Workspace` and `WorkspaceContact` share their consumer set entirely.

### Test 3 — Different sensitivity

The entity has distinct encryption-at-rest requirements, retention windows, PII
exposure, or wire redaction rules.

Examples of yes:

- `WorkspaceIntegration.config` is encrypted at rest with a KMS-derived key; the
  workspace's own JSONB metadata is not.
- Financial receipts have a regulatory-minimum 7-year retention; general
  workspace data does not.

Examples of no:

- Adjacent entities that share tenant-standard retention + PII rules.

### Enforcement

Score each entity on the 3-test at authoring time. Record the outcome in the
module's `readme.md` under the "Extraction rationale" section (if extracted) or
"Kept together with X because ..." (if kept).

## When NOT to extract

Even when the 3-test suggests extraction, keep entities together if any of these
apply:

- **1:1 parent-child FK with cascade** — `DomainRecord` cannot exist without a
  `Domain` parent. Splitting produces two modules that always change together.
  Keep them together, extract as a pair.
- **N=1 consumer** — if only one product monolith would use the module, live it
  inside that monolith (`apps/<product>/src/modules/`), not in
  `modules/products/`.
- **Single-owner cluster** — a set of entities that ONE team fully owns and
  touches together at every mutation. Splitting them creates cross-module
  coordination cost for no boundary gain.

## Naming rules for extracted modules

The 3-test tells you WHEN to extract. Naming tells you WHAT to call the result.

- **Group name for a pair** — when two entities share a lifecycle (`Domain` +
  `DomainRecord`), name the module after the parent's plural or the domain
  concept (`domains`, not `domain-and-records`).
- **Singular vs. plural** — plural when the module owns multiple entities or a
  registry (`domains`, `notifications`, `integrations`). Singular when the
  module IS one thing (`compliance`, `workspaces`, `branding`).
- **Never suffix `-service`** at the module level. Services are deployment
  boundaries; modules are code boundaries. The module `platform/workspaces` runs
  inside the `platform-service`, not the `platform-service-service`.
- **Never name a module after a trait it publishes.** `has-files` is a trait,
  not a module.
- **Reserve top-level tier names** (`shared`, `identity`, `platform`, `access`,
  `billing`, `notifications`, `compliance`, `products`).

## Priority assignment for extractions

When you extract a module, its priority depends on its position in the DAG:

- **Extracted "up"** (earlier in boot order than the source) — pick a priority
  strictly LOWER than the source. e.g. `application` extracted from `workspaces`
  sits at priority 8 (workspaces=10).
- **Extracted "sideways"** (same wave as the source) — pick a priority strictly
  GREATER than the source. e.g. `domains`, `branding`, `integrations` extracted
  from `workspaces` sit at priority 12 (workspaces=10).
- **Extracted "down"** (later in boot order) — pick a priority strictly GREATER,
  aligned with the target wave.

Ties are allowed between unrelated modules (no dependency edge). Ties are
forbidden between modules on a dependency edge — the validator refuses.

## Retrofit — splitting an existing module

When retro-extracting (like platform v0.3), follow this order:

1. **Confirm the 3-test with the tier README author.** Never extract on
   instinct; write the score.
2. **Move schemas first** via
   `mv modules/<source>/schemas/<entity>.schema.json modules/<target>/schemas/`.
3. **Move sdui/resources** the same way.
4. **Author the new module.json.** Copy the source's, prune to the extracted
   entities, adjust priority per the rules above.
5. **Slim the source module.json.** Remove extracted resources from
   `contributes.resources[]`. Add the new module to `extendedBy[]` if the source
   now depends on the extract.
6. **Update `dependencies[]`** on the source if the extracted module boots
   earlier (like `application` extracted upward from `workspaces`).
7. **Update ULID registry `module` fields** for every prefix whose ownership
   moved. Run the validator; the ULID prefix check catches drift.
8. **Update cross-refs**:
   - `platform/README.md` (or the tier README) — the module table.
   - `modules/README.md` — the tier map totals.
   - `shared/foundation/data/module-graph.dot` — new clusters + edges.
   - Any spec file that referenced the source module as the owner of the
     extracted entity.
9. **Run the validator.** Must return 5/5 green before the split is considered
   done.

Reversibility: because module identity is the folder basename (not its tier or
its dependencies), extraction is CHEAP to reverse — a `mv` + a `module.json`
merge. Do the extraction while it's cheap (before code is written); reversing a
split with 100 files of Laravel code is not cheap.

## Anti-patterns

| Anti-pattern                                                         | Preferred                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Mega-module (9+ entities) with no clear bounded context              | Score the 3-test per entity; extract wherever 2 tests fire.         |
| Splitting a 1:1 parent-child pair into two modules                   | Keep them; the module owns the pair.                                |
| Naming a module `-service` at the module tier                        | Service is deployment; module is code. Never conflate.              |
| Extracting because "it feels cleaner"                                | Score the 3-test. If it doesn't score, don't extract.               |
| Placing product-specific code in a platform-tier module              | Move it to `modules/products/<name>/` or into the product monolith. |
| Cross-service entity in a service tier (e.g. Identity in workspaces) | Move to the correct tier; delete the stub.                          |
| Priority tied to a module on a dependency edge                       | Adjust one — the validator will refuse otherwise.                   |

## Related

- `.kiro/specs/module-blueprints/PLAN.md` §3 — the per-module blueprint contract
  every module (source and extracted) follows.
- `.kiro/steering/module-graph.md` — how the module graph is expressed.
- `.kiro/steering/priority-ordering.md` — the wave / priority convention.
- `.kiro/steering/hierarchy.md` — canonical structural + terminological rules.
