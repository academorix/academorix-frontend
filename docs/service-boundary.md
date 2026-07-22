# Service boundary — the four seams

**Anchor:** [ADR-0022](adr/0022-language-agnostic-service-boundary.md).

Stackra is polyglot on purpose: **Laravel for the tenant business API, Python
for AI/ML.** Every service, in any language, participates in the same four
seams. This document is the narrative walkthrough of those seams — the
machine-readable contracts live under `docs/contracts/*.schema.json`, and the
day-to-day rules live in `.kiro/steering/service-boundary.md`.

## Why polyglot

- **Laravel keeps Sanctum, Horizon, Eloquent, Scramble, Nova.** No Python
  framework ships that ecosystem out of the box.
- **Python keeps its ML tooling.** PyTorch, HuggingFace, LangChain, sklearn —
  every one is native to Python, not Laravel.
- **A new language means a new SERVICE, not a rewrite.** Adding Go for a
  WebSocket hot path is a new binding against the existing contracts, not a
  migration.

The rule for adding a new language: **profiling evidence, alongside Laravel +
Python**. Never as a replacement.

## The four seams

### Seam 1 — Identity

Every service that talks to Laravel carries a **Sanctum personal access token**
issued from Laravel's `service_accounts` table. The PAT authenticates HTTP
calls. The PAT carries a minimal, explicit ability set (default-deny; per-action
grant list). Laravel is the single source of truth for authorization.

**Contract:** `docs/contracts/service-identity.v1.schema.json`.

**Owner:** Laravel (`packages/backend/identity/service-accounts/`).

**Rotation:** service PATs rotate every 90 days. Rotation is a side-by-side
deploy — provision the new PAT, redeploy the consuming service pointing at the
new PAT, revoke the old PAT. No downtime.

### Seam 2 — Inbound trust

For service-to-service RPC that isn't routed through the tenant HTTP API
(typical case: `ai-service` reading a prompt-context payload directly from
`api`, without a tenant user in the loop), the caller signs a short-lived
**HS256 JWT** with a >=32-byte Doppler secret. The receiver verifies signature +
`exp` (30s skew) + `iat` (30s skew) + `aud` == own service slug + non-empty
`iss` + non-empty `tenant_id`. See the 13-step verification order below.

**Contract:** `docs/contracts/service-jwt.v1.schema.json`.

**Verification:** `docs/contracts/service-jwt.v1.md` (13 steps in order).

**Secret:** a `SERVICE_JWT_SIGNING_KEY` Doppler variable, >=32 bytes, rotated
every 90 days.

**Signature scheme:** HS256 is fixed. Changing to RS256 / ES256 is a breaking
change (new schema version + coordinated rollout).

### Seam 3 — Data

Services speak the shared wire shapes ONLY:

- **HTTP DTOs** live in `packages/domain/` (proposed) and are generated from
  `docs/contracts/*.schema.json`.
- **Kafka topic schemas** live in `stackra-ai/packages/topics/` and are
  versioned per topic.
- **HTTP response envelopes** follow one of three shapes:
  - **List:**
    [`docs/contracts/list-envelope.v1.schema.json`](contracts/list-envelope.v1.schema.json)
    — `{data: [...], meta: {...}, links: {...}}`.
  - **Single item:**
    [`docs/contracts/single-envelope.v1.schema.json`](contracts/single-envelope.v1.schema.json)
    — `{data: {...}, message?: string}`.
  - **Error:**
    [`docs/contracts/error-envelope.v1.schema.json`](contracts/error-envelope.v1.schema.json)
    — `{message, errors?: {field: [msg, ...]}}`.

**No service reads another service's database directly.** Cross- service
aggregation goes through (a) a materialised view owned by the reading service or
(b) a per-service HTTP endpoint that shapes the payload.

### Seam 4 — Observability

Every service propagates:

- **`X-Correlation-Id`** — on inbound + outbound HTTP calls. Every log line +
  every span carries it.
- **`traceparent`** — on outbound Kafka messages. Consumers derive parent span
  from it.

Every service emits the standard structured log shape:

```jsonc
{
  "timestamp": "2026-07-21T14:32:17.123Z",
  "level": "info",
  "service": "api",
  "tenant_id": "tnt_01H...",
  "trace_id": "abc123...",
  "span_id": "def456...",
  "message": "...",
}
```

Every service exposes:

- **`/health`** — liveness check. Returns 200 when the process is responsive. No
  downstream calls.
- **`/ready`** — readiness check. Returns 200 when downstream dependencies (DB,
  Redis, Kafka, upstream services) are reachable. Returns 503 with a JSON body
  listing failed checks.

## Walking a request end-to-end

A tenant user posts a message that triggers an AI-generated draft. The request
flow:

```
Browser
  │  Authorization: Bearer <user PAT>
  │  X-Correlation-Id: <newly generated>
  ▼
api  (Laravel)
  │  verifies user PAT via Sanctum
  │  runs the Action, generates a draft-request payload
  │  signs an HS256 JWT with iss='api', aud='ai-service',
  │    tenant_id=<user's tenant>, sub=<service_account_id>
  │  X-Correlation-Id: <propagated>
  ▼
ai-service  (Python + FastAPI)
  │  verifies JWT (13 steps below)
  │  calls upstream LLM provider
  │  emits Kafka event 'ai.draft.generated' with traceparent
  │  returns 200 { data: { draft_id, tokens_used }, message: '...' }
  ▲
api
  │  updates the aggregate, returns 200 to the browser
  ▲
Browser
```

Every hop:

- Carries an X-Correlation-Id (Seam 4).
- Speaks a documented wire shape (Seam 3).
- Uses the caller's OWN identity — never the user's PAT proxied through (Seam 1,
  D5).
- Verifies inbound trust (Seam 2).

## Adding a new service — checklist

Copy-paste checklist for a new deployable:

- [ ] Decide the language (Laravel / Python / other with profiling evidence).
- [ ] Assign a service slug (`api`, `ai-service`, `stream-gateway`, ...). Slug
      becomes the JWT `aud` claim + the log `service` field.
- [ ] Provision a `service_accounts` row (Seam 1) with the minimal ability set
      the service needs.
- [ ] Generate a `SERVICE_JWT_SIGNING_KEY` in Doppler (Seam 2).
- [ ] Wire the `/health` + `/ready` endpoints (Seam 4).
- [ ] Wire structured logging with `service` set to the new slug (Seam 4).
- [ ] Generate DTOs / clients from `docs/contracts/*.schema.json` (Seam 3).
- [ ] Add the service to the platform CI matrix.
- [ ] Land an ADR IF the service introduces a new language.

## When NOT to add a service

The default is **add a package or a module**, not a service. A service pays off
only when:

- The runtime profile differs (CPU / memory / GPU).
- The release cadence differs (independent deploys).
- The blast radius is worth isolating (an LLM provider outage should not affect
  the tenant API).
- The language differs (Python for ML, Go for WebSocket fan-out).

`apps/stream-gateway` (Go) is _speculative_ — the contract is authored so the
service can be added when profiling evidence demands it. The service does not
exist today.

## Contract-change discipline

- **Adding an OPTIONAL field is a patch bump.** Every consumer keeps working.
  Ship it.
- **Renaming, removing, or tightening a constraint is a MAJOR bump.** Requires a
  coordinated rollout across every consumer. Bump the schema `$id` version; the
  old schema stays available until every consumer has migrated.
- **Signature-scheme changes are ADR-worthy.** HS256 is fixed. If we need to
  move to RS256, land a new ADR + new schema version
  - coordinated rollout.
- **Every breaking change lands with:**
  - The new schema at a bumped `$id`.
  - A coordinated PR touching PHP + Python + (future) Go bindings.
  - The `docs-adr-steward` as co-reviewer.

## Cross-references

- [ADR-0022](adr/0022-language-agnostic-service-boundary.md) — the decision this
  document narrates.
- [`.kiro/steering/service-boundary.md`](../.kiro/steering/service-boundary.md)
  — the day-to-day rule set.
- [`docs/contracts/README.md`](contracts/README.md) — the five contract rules.
- [ADR-0027](adr/0027-row-level-attribution-three-axes.md) — the tenant_id claim
  the Seam 2 JWT carries.
- [ADR-0028](adr/0028-runtime-target-laravel-octane.md) — the Octane-safety
  constraint the Laravel-side JWT verifier must respect.
