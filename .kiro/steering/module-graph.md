---
inclusion: manual
---

# Academorix — Module Dependency Graph

The canonical view of how the 22 backend modules relate. This steering doc is
the human-readable index; the machine-readable source of truth lives at
`modules/foundation/data/module-graph.dot`, and the CI check that keeps them in
sync lives at `modules/foundation/scripts/validate-module-graph.py`.

Render the graph locally:

```
dot -Tsvg modules/foundation/data/module-graph.dot -o module-graph.svg
```

## Wave layering

Modules boot in **wave order** — every dependency must finish booting before its
consumer starts. Priority numbers are lower for earlier waves; the validator
refuses to accept an edge A→B where B.priority ≥ A.priority. See
`priority-ordering.md` for the numeric convention.

### Wave 0 — foundation (`priority=0`)

- `foundation` — the platform substrate. Owns HTTP primitives, base traits, base
  migrations, module discovery, health aggregator, and the migration macros
  every downstream module composes. Ships **zero domain entities**; every
  schema-owning module extends this base.

### Wave 1 — substrate + versioning (`priority=10–12`)

- `workspaces` (10) — the primary tenancy boundary. Owns Application, Workspace,
  BusinessType, Domain, Branding, Identity. Every workspace-scoped entity in
  later waves composes `BelongsToWorkspace`.
- `versioning` (12) — public-interface versioning (REST + payload + webhook +
  GraphQL). Distinct from foundation's row-level `HasVersions` trait.
- `telemetry` (12) — three-signal observability (traces + metrics + logs). See
  the module readme for the OTel + Monolog stack.

### Wave 2 — audit / activity / settings (`priority=20–22`)

- `audit` (20) — compliance-grade audit trail with a cryptographic hash chain.
- `activity` (20) — per-workspace activity feed. Softer semantics than audit.
- `settings` (22) — attribute-discovered registry for platform + workspace
  settings.

### Wave 3 — entitlements + subscription primitives (`priority=22–29`)

- `entitlements` (22) — per-workspace quota tracking. Redis hot path, Postgres
  source-of-truth. Publishes the four entitlement kinds (slot / pool / boolean /
  unlimited).
- `webhook` (22) — outbound webhook substrate. Consumes versioning for payload
  transformer chains.
- `transfer` (23) — import + export operations.
- `invitations` (25) — target_type-agnostic invitation substrate.
- `subscription` (29) — plan definitions + Cashier integration. Depends on
  `entitlements` (default_entitlements sync on plan swap) + `notifications-mail`
  (welcome + upgrade notifications), which is why its priority is highest in
  this wave.

### Wave 4 — notifications core + transports (`priority=20 core, 26 transports`)

- `notifications` (20) — unified notification core. Owns delivery record +
  template registry + preference resolver + digest scheduler. Channel-agnostic.
  Priority 20 because transports depend on it, not the other way around
  (surprising but correct — see the module readme for the microservice readiness
  rationale).
- `notifications-mail` (26), `notifications-push` (26), `notifications-sms`
  (26), `notifications-in-app` (26) — channel-specific transports subscribing to
  `NotificationDispatched`.

### Wave 5 — search + geo + localization (`priority=30`)

- `search` — full-text + vector search substrate.
- `geography` — nnjeim/world wrapper for reference geo entities + IP
  geolocation.
- `geofencing` — PostGIS geofence primitive. Model-agnostic via `HasGeofence`
  trait; polymorphic `fenceable_type/fenceable_id` on `GeofenceCheck`.
- `localization` — Laravel-localization wrapper + machine-translation drivers.
  Publishes `HasTranslations` (wraps `spatie/laravel-translatable ^6.0`) +
  `#[Translatable]`. See `localization-content-strategy.md`.

### Wave 6 — domain-shaped surfaces (`priority=35+`)

- `newsletter` — the current domain-shaped surface. Consumes workspaces +
  notifications for send fan-out.

## Reading the graph file

`modules/foundation/data/module-graph.dot` is a Graphviz DOT file. Every node is
a module; every arrow is a dependency (A→B means A depends on B, so B boots
first). Colours match the wave taxonomy above. The `cluster_legend` subgraph
documents the colour scheme in-graph.

## Real vs planned consumers

Every `module.json` carries two arrays:

- `extendedBy` — modules that CURRENTLY exist on disk and consume this one.
- `planned_consumers` — modules referenced as future consumers but not yet
  implemented (e.g. `user`, `access`, `auth`, `organization`, `region`,
  `branch`, `facilities`, `teams`, `sports`, `compliance`, `safeguarding`).

The validator refuses any `extendedBy` entry that isn't a module folder. Every
planned consumer flows into the `reserved_for_future` block of the ULID prefix
registry (see `ulid-prefix-registry.md`).

## Boot-order safety

The validator enforces the invariant strictly. When adding a new module or
adjusting priorities:

1. Update the module's `priority` in `module.json`.
2. Add the new module (or updated dependency) in `module-graph.dot`.
3. Run `python3 modules/foundation/scripts/validate-module-graph.py`.
4. Fix any surfaced violations before merging.

See `priority-ordering.md` for the priority convention itself.

## What this doc does NOT do

- **Does not enumerate every event / listener wire.** That's each module's
  `events.json` + `listeners.json`.
- **Does not document runtime host layout** (central / central_admin / workspace
  / mobile). That's each module's `hosts` block in `module.json`.
- **Does not cover frontend module structure.** See
  `frontend-module-architecture.md` for the SPA-side module organisation.
