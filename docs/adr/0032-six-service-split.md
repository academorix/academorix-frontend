# ADR 0032 — Six-service deployment split (Option B)

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Backend architecture +
Product lead

## Context

Stackra has been developed as a single set of ~90 Composer packages under
`packages/backend/**` with the intent that they would eventually run as
independent services. Two topologies were on the table when the SDK layer was
deleted (see §Options):

- **Option A — Modular monolith.** One deployable Laravel Octane app that
  requires every package. Package boundaries stay clean; deployment stays
  simple. Split later if / when scale forces it.
- **Option B — Six services from day 1.** Four SHARED cross-Application
  services (`identity`, `commerce`, `notifications`, `observability`) + two
  PER-APPLICATION services (`academorix-api`, `academorix-ai`). Cross-service
  calls flow over HTTP with signed JWTs + `X-Service-Identity` headers per
  ADR-0033.

The workspace also carried an SDK layer under `packages/sdk/` +
`packages/backend/sdk/` — 18 SDK packages designed to let services talk to
each other via typed HTTP wrappers. That layer was deleted in the same commit
that introduced this ADR: the wire contract now lives in
`docs/contracts/*.schema.json`, not in per-service SDK packages.

Six months of package growth revealed:

1. **Different SLA profiles.** The identity plane is critical path (every
   request touches it). The AI runtime is bursty (LLM latency dominates).
   Notifications is high-throughput but tolerant of retry. One-size-fits-all
   scaling is wasteful.
2. **Different deployment cadences.** Identity + commerce schema changes are
   heavily reviewed. Product code (academorix-api) ships daily.
3. **Isolation properties matter.** An OpenAI 503 must NOT take down
   `/api/v1/branches`. A Paddle webhook storm must NOT starve identity's
   login endpoint.
4. **Multi-Application is a first-class requirement.** Sports today,
   Marketplace tomorrow. Each product's backend deploys independently.
5. **The framework tier is stable.** foundation + framework/\* + shared/\*
   substrate is a Composer-linked shared dependency, not a separately-deployed
   layer.

## Options considered

### Option A — Modular monolith first (rejected)

Ship one Laravel Octane app that composes every package. Package boundaries
stay clean per `.kiro/steering/hierarchy.md §6`. Split into services later
when a specific bounded context needs to scale or deploy independently.

**Pros.**

- Simplest ops story — one Doppler config, one Horizon supervisor, one
  container image.
- Zero inter-service auth, zero JWT verification per call, zero contract
  drift.
- Every module talks in-process via DI — direct method calls, no HTTP.
- Refactoring across module boundaries is a normal PR.

**Cons.**

- No SLA isolation. Every module shares one worker pool.
- No independent scaling. The AI service scales with the identity plane.
- Blue/green deployment surfaces every module change at once.
- Multi-Application is possible but requires an extra request-scoped context
  layer that separate services would carry naturally.

**Why rejected.** Points 3–5 above force the split. Isolation is not a "nice
to have" — a Paddle webhook storm on a single-service monolith cascades to
login failures. Multi-Application requires per-product deploys — a monolith
that swaps modules per product is theoretically possible but adds a whole new
concern (application-scoped module registration) that the six-service split
handles naturally by deploying different `academorix-<product>-api` images.

### Option B — Six services from day 1 (chosen)

Deploy four SHARED cross-Application services + two PER-APPLICATION services:

| Service                    | Deployment      | Owns                                                        |
| -------------------------- | --------------- | ----------------------------------------------------------- |
| `stackra-identity`         | SHARED          | Application + Tenancy + Identity + User + Auth + MFA + Access |
| `stackra-commerce`         | SHARED          | Subscription + Entitlements                                 |
| `stackra-notifications`    | SHARED          | All channels + messaging + newsletter                       |
| `stackra-observability`    | SHARED          | Audit + Activity + Monitoring + Compliance + Retention      |
| `academorix-api`           | PER-APPLICATION | Physical hierarchy + product-specific domain + safeguarding |
| `academorix-ai`            | PER-APPLICATION | Personas + tools + LLM orchestrator                         |

Cross-service auth flows via JWT (user calls) + `X-Service-Identity` header
(machine calls) per ADR-0033.

**Pros.**

- SLA isolation by construction — Paddle traffic hits commerce, not identity.
- Independent scaling — AI runs on GPU nodes, identity on CPU nodes.
- Independent deployment — academorix-api ships daily, identity ships weekly.
- Per-Application deploys are natural — each product gets its own
  `<product>-api` image + its own DB partition.
- Framework tier stays a shared Composer substrate — the split doesn't
  fragment `foundation` / `framework/*`.

**Cons.**

- Cross-service auth adds latency (JWT verify) + operational burden (JWKS
  rotation, secret management).
- Contract drift is a real risk — the wire contract must be pinned in
  `docs/contracts/*.schema.json` and enforced via CI.
- Provisioning atomicity (create Tenant + owner User + first Subscription)
  requires either a distributed transaction OR co-location of the involved
  packages. We chose co-location — see D2.
- Six pipelines, six Doppler configs, six migrations to keep aligned.

**Why chosen.** The SLA isolation + per-Application deployment properties are
not achievable in a monolith without duplicating most of the same
infrastructure inside one app. If we're going to run separate worker pools,
separate DBs, and separate deploy pipelines, we might as well run separate
services and let the deployment fabric enforce the isolation.

### Option C — Fine-grained microservices (rejected)

Split further: separate `tenancy-service` from `identity-service`,
`application-service` from `tenancy-service`, one service per notification
channel, one service per compliance concern. ~20 services total.

**Why rejected.** `.kiro/steering/hierarchy.md §12` non-goals are explicit:

> Never split Identity from User, User from Access, Auth from Identity, or
> Subscription from Entitlements. Provisioning atomicity depends on the
> co-location.

Creating a Tenant + Owner User + default Roles + first Subscription grant is
one transaction. Splitting the identity plane forces distributed transactions
for every provisioning flow. The commerce plane has the same property —
Subscription and Entitlements must commit together.

Fine-grained microservices trade one hard problem (deployment isolation) for a
worse one (distributed transactions). We chose the coarser split.

## Decision

### D1 — Six services, four shared + two per-Application

Deploy exactly the six services enumerated in Option B. Each service:

- Its own Laravel Octane app under either `services/<name>/` (shared) or
  `apps/<product>-<name>/` (per-Application).
- Its own Doppler config: `stackra-<service>` / `dev_<service>` /
  `stg_<service>` / `prd_<service>`.
- Its own migrations for the packages it owns.
- Its own container image built from `docker/<service>.Dockerfile`.
- Its own Redis + Postgres cluster identity in production.
- Its own Horizon supervisor + queue set.

The framework tier (`packages/backend/framework/*` + `packages/backend/foundation`
+ `packages/backend/shared/*` + `packages/backend/telemetry/*` +
`packages/backend/authorization` + `packages/backend/compliance/architecture`)
is EMBEDDED in every service via Composer path-repository symlinks. It is not
a deployed service.

### D2 — Provisioning atomicity via co-location, not distributed transactions

The identity plane co-locates Application + Tenancy + Identity + User + Auth
+ MFA + Access + ServiceAccount + Credentials in one service (`stackra-
identity`) because every provisioning flow that touches one of them touches
all of them.

The commerce plane co-locates Subscription + Entitlements in one service
(`stackra-commerce`) for the same reason.

Fine-grained microservices for these planes are permanently rejected. This
decision is codified in the steering `hierarchy.md §12` non-goals and is not
subject to per-package overrides.

### D3 — Every backend package belongs to exactly ONE service

The ownership map lives in `docs/services.md §2`. That map is the sole source
of truth for "which service owns this row." Rules:

- Every package's `composer.json` declares `stackra` (via composer's `type`
  or `keywords`) so ownership is grep-able.
- Every new package added to `packages/backend/**` MUST be assigned to a
  service in the same commit that introduces it.
- Moving a package from one service to another is a schema-migration event
  (its rows must be moved) and requires an ADR.

### D4 — SDK layer deleted; contracts live in `docs/contracts/`

The 18 SDK packages under `packages/sdk/` + `packages/backend/sdk/` are
deleted in the same commit that introduces this ADR. The wire contract lives
in `docs/contracts/*.schema.json` — one JSON Schema per shape crossing a
service boundary. Contract enforcement runs in CI (JSON Schema validation of
sample payloads); typed clients are generated per language in downstream
tooling, not shipped from this repo.

Rationale: SDKs coupled every service to every other service's release
cadence. A change to identity's request shape required 5 downstream SDK
version bumps. Schemas decouple the wire contract from the client library —
each language can generate its own typed client from the JSON Schema at its
own pace.

### D5 — `academorix-api` owns physical hierarchy + product-specific domain

The per-Application backend service owns:

- `packages/backend/platform/*` — physical hierarchy (Region + Organization
  + Branch + Facility + Teams + Staff + Reception + …).
- `packages/backend/workflow/*` — Approvals + Tasks.
- `apps/academorix/src/modules/*` — every product-specific domain module,
  including `platform/safeguarding` (moved out of the shared platform packages
  in the same commit — safeguarding is a per-Application concern).

Future Applications (Marketplace, Ticketing, …) each get their own
`<product>-api` deployment with the same shape. Domain modules are per-product
by construction — Sports' Athlete has zero meaning to Marketplace.

### D6 — `academorix-ai` is a separate deployment even for the same product

Even though `academorix-ai` and `academorix-api` belong to the same
Application, they run as separate services. Rationale (`hierarchy.md §12`):

- Different runtime profile (LLM = high memory, bursty; API = CPU-bound,
  steady).
- Different SLA — LLM provider outages must not affect the transactional API.
- Different scale profile — AI runs on GPU nodes when self-hosted.

The two share a database only for the tenant-scoped tables both need to read
(user + tenant + branch); the AI service's own tables (personas, tools,
runs, draft-confirms) live in its own DB.

## Consequences

**Positive.**

- SLA isolation by construction — one service's incident doesn't cascade.
- Independent scaling per service — right-sized worker pools per workload.
- Independent deployment cadence — academorix-api ships daily, identity
  weekly.
- Per-Application deploys are natural — each product's backend is its own
  container.
- Framework tier stays a shared Composer substrate — the split doesn't
  fragment `foundation` / `framework/*`.
- Contract-first cross-service auth (ADR-0033) is grep-able, versionable,
  and CI-enforceable.

**Negative.**

- Six Doppler configs, six pipelines, six migrations to keep in sync.
- Cross-service auth adds latency (JWT verify) + operational burden (JWKS
  rotation).
- Contract drift risk — must be pinned in `docs/contracts/*.schema.json` and
  enforced via CI.
- Dev-env overhead — `docker compose up identity commerce academorix-api` is
  the new default entry point.
- Cross-service failures need coordinated runbooks — an outage in identity
  cascades to a login failure across every other service.

**Neutral.**

- The package-boundary work already done is preserved. Every backend package
  keeps its own composer.json, its own service provider, its own tests. The
  split changes DEPLOYMENT, not package structure.
- The three-axis row-attribution contract (ADR-0027 + ADR-0031) is
  unchanged. Tenant / Application / Scope cascades still apply within each
  service's DB.

## Follow-up work

Execution lives in `.kiro/reports/`:

- `stamp-services.py` — created 4 shared services under `services/` from
  `apps/laravel-template`. Landed in the same commit as this ADR.
- `move-safeguarding-to-academorix.py` — moved `packages/backend/platform/
  safeguarding` → `apps/academorix/src/modules/platform/safeguarding`.
  Landed in the same commit.
- `sweep-deleted-package-refs.py` — stripped downstream composer.json
  references to deleted SDK + shared packages. 40 composer.json files
  mutated. Landed in the same commit.

Still pending (subsequent commits):

- **`docker/<service>.Dockerfile`** — one Dockerfile per service.
- **`docker/compose.dev.yml`** — multi-service local dev.
- **`.github/workflows/php.yml`** — CI matrix over six services.
- **`docs/contracts/*.schema.json`** — five schemas (service-identity,
  service-jwt, list-envelope, single-envelope, error-envelope).
- **ADR-0033** — cross-service auth contract (companion, landed same commit).
- **Per-service Doppler init** — `stackra-<service>` project + `dev_/stg_/
  prd_` configs.

## Related work

- ADR-0022 — Language-agnostic service boundary (the four seams that make
  the six-service split possible).
- ADR-0027 — Row-level attribution: three axes (`tenant_id` / `application_id`
  / `scope_node_id`).
- ADR-0031 — `application_id` central-plane extension (adds `plans`,
  `auth_jwt_signing_keys`, `service_accounts`, `domains`).
- ADR-0033 — Cross-service authentication contract (JWT + `X-Service-
  Identity` header).
- ADR-0034 — Runtime target: Laravel Octane (Swoole driver).
- `.kiro/steering/hierarchy.md §12` — the service split non-goals this ADR
  codifies.
- `docs/services.md` — the operational contract for the six-service topology.
- `docs/contracts/README.md` — the wire-contract narrative (schemas that
  replaced the deleted SDKs).
