# ADR 0022 — Language-agnostic service boundary + four seams

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Chief orchestrator +
Backend architecture + Security lead

## Context

Stackra ships two production deployables today with a third planned:

- **`api`** — Laravel + PHP; owns tenant identity, RBAC, billing, and every
  business aggregate for the sports vertical.
- **`ai-service`** — Python + FastAPI; owns LLM orchestration, tool execution,
  and inference caching.
- **`stream-gateway`** (planned) — Go; would handle the WebSocket fan-out on a
  hot path where PHP + Python both underperform.

Two questions surface every quarter:

1. **"Shouldn't we just rewrite the backend in Python (or Go, or TypeScript)?"**
   The pitch is always the same — one language across the stack simplifies
   hiring, tooling, and code review.
2. **"How does service X talk to service Y?"** Without a written contract, each
   pair of services invents its own auth scheme, its own retry policy, its own
   error format, its own observability convention.

Both questions are load-bearing. Answering them wrong means either (a) burning a
year to consolidate onto one language and losing Laravel's ecosystem (Sanctum,
Horizon, Eloquent, Nova, Scramble), or (b) letting every service-pair drift into
its own bespoke boundary and paying the interop tax forever.

The pattern that resolves both — used across every mature polyglot platform
(Stripe's PHP + Ruby + Go + Java stack, Airbnb's Ruby + Java

- Python, GitHub's Ruby + Go) — is **one contract, N language bindings**. The
  wire format is canonical; every language generates its client + server from
  the same schema. Adding a new language is a new binding, not a rewrite. Auth,
  error shape, observability, identity are documented once and every service
  enforces them the same way.

## Options considered

1. **Consolidate onto one language (Python) — reject.** Loses Laravel's
   ecosystem entirely; every mature vendor (Sanctum, Horizon, Eloquent, Nova,
   Scramble) has no Python equivalent that ships out of the box. 12+ months to
   break even; feature velocity drops to zero during migration.

2. **Consolidate onto one language (Go / Rust for perf) — reject.** Same as
   above with additional cost: no Django-class framework exists in Go / Rust, so
   we'd write the framework from scratch.

3. **Let each service invent its own boundary — reject.** Failure modes
   documented above. Every new service pair adds N^2 bespoke pairs.

4. **Language-agnostic contract + four seams (chosen).** Laravel stays the
   tenant business API. Python stays the AI service. Go (when it lands) handles
   the WebSocket hot path. Every service integrates through exactly four seams:
   identity, inbound trust, data, observability. Each seam has a written
   contract; each contract has language bindings. Adding a new service is a new
   binding against the existing contract, never a rewrite.

## Decision

### D1 — Polyglot on purpose

**Laravel for the tenant business API. Python for AI/ML.** Every other service
is added only when the existing stack demonstrably can't meet the requirement.
"Demonstrably" means profiling evidence, not preference. A new language for a
service is allowed only alongside Laravel + Python — never as a replacement.

### D2 — Four seams, and only four

Every deployable, in any language, integrates through these four seams and
nothing else:

**Seam 1 — Identity.** Each service holds a Sanctum PAT (issued from Laravel's
`service_accounts` table). The PAT authenticates HTTP calls to Laravel. The PAT
carries a **minimal, explicit ability set** (default-deny; per-action grant
list). Laravel is the single source of truth for authz. Contract:
`docs/contracts/service-identity.v1.schema.json`.

**Seam 2 — Inbound trust.** For service-to-service RPC that isn't routed through
the tenant HTTP API (e.g. AI service reading a prompt-context payload from
tenant-api), the caller signs an HS256 JWT with a >=32-byte Doppler secret. The
receiver verifies signature

- `exp` (30s skew) + `iat` (30s skew) + `aud` == own service slug + non-empty
  `iss` + non-empty `tenant_id`. Contract:
  `docs/contracts/service-jwt.v1.schema.json`; verification steps in
  `docs/contracts/service-jwt.v1.md`.

**Seam 3 — Data.** Services speak the shared wire shapes only: Kafka topic
schemas (`stackra-ai/packages/topics`) + shared HTTP DTOs (`packages/domain/`).
No service reaches into another service's database directly. Cross-service reads
that need aggregation go through a materialised view or a per-service HTTP
endpoint.

**Seam 4 — Observability.** Every service propagates `X-Correlation-Id` on
HTTP + `traceparent` on Kafka messages, and emits the standard structured-log
shape:

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

Every service exposes `/health` (liveness) + `/ready` (readiness with downstream
dependency checks).

### D3 — Contracts are the source of truth

Every wire shape lives under `docs/contracts/*.schema.json` as JSON Schema draft
2020-12. Every consumer generates code from the schema — TypeScript types,
Python dataclasses, PHP DTOs. Contract change discipline:

- **Adding an OPTIONAL field is safe** — patch bump; every consumer keeps
  working.
- **Renaming, removing, or tightening a constraint is BREAKING** — requires
  coordinated PHP + Python + (future) Go rollout in one release cycle. Bump the
  `$id` version.
- **The signature scheme is fixed** — HS256 over a >=32-byte Doppler secret.
  Refuse to boot on a weak / short secret. If cryptographic requirements change,
  ship a new ADR + a new schema version; don't quietly rotate the algorithm.

### D4 — Every cross-service token is tenant-scoped

Every service JWT carries a `tenant_id` claim. Verification fails on missing /
empty `tenant_id` (verification step 11). No tenant_id, no trust. Central-plane
admin operations use a distinct `platform-admin` PAT — never a tenant-scoped
JWT.

### D5 — Do not proxy end-user tokens

An end-user's Sanctum bearer token stays inside the service the user
authenticated to. Downstream services use their OWN service identity (Seam 1) to
make delegated calls; the tenant + acting-user context flow through the payload
(`tenant_id`, `on_behalf_of_user_id`), not through the bearer token. This is a
HARD security boundary — leaking a user's PAT to a downstream service turns
every service into a privilege-escalation target.

### D6 — No side-channel headers

New cross-service metadata extends an existing contract schema. Do not invent
`X-Stackra-Internal-*` headers to smuggle metadata between services. Every
header + payload field is documented in a schema; every consumer generates
against the schema.

## Consequences

**Positive:**

- **Polyglot works.** Laravel keeps its ecosystem; Python keeps its ML
  ecosystem; Go (when it lands) handles WebSocket fan-out at the right layer.
- **Contracts survive rewrites.** If we ever rewrite the AI service in Rust, the
  contract stays put; only the language bindings change.
- **Auth is uniform.** Every service authenticates the same way. Every service
  verifies the same way. New service, one config file.
- **Observability just works.** Correlation IDs flow end-to-end without
  per-service plumbing.

**Negative:**

- **N-language bindings to maintain.** Adding a new language means authoring a
  code generator (or vendoring one) for that language. Mitigated by JSON Schema
  being the interchange — every mature language has a schema-to-code generator.
- **Contract review is a coordination cost.** A breaking change requires a
  coordinated rollout across every language. Mitigated by additive changes being
  safe (optional field, patch bump).
- **Every service ships a `/health` + `/ready` even if trivial.** The uniformity
  is worth the boilerplate.

**Neutral:**

- **Kafka is the only async fan-out.** Redis pub/sub, in-memory event buses, and
  NATS are not considered for cross-service messaging. When Kafka doesn't fit
  (e.g. request/response RPC), the seam is HTTP + Sanctum PAT.

## Related work

- `.kiro/steering/service-boundary.md` — the day-to-day rule set this ADR
  codifies.
- `docs/service-boundary.md` — the four-seam narrative in prose.
- `docs/contracts/README.md` — the five-rule contract preamble.
- `docs/contracts/service-identity.v1.schema.json` — Seam 1 schema.
- `docs/contracts/service-jwt.v1.schema.json` — Seam 2 schema.
- `docs/contracts/service-jwt.v1.md` — the 13-step JWT verification companion.
- `docs/contracts/list-envelope.v1.schema.json`,
  `single-envelope.v1.schema.json`, `error-envelope.v1.schema.json` — the HTTP
  response envelope shapes every service returns.
- ADR-0027 — Row-level attribution: three-axes column contract (the tenant_id
  claim in Seam 2 tokens ties to this contract).
- ADR-0028 — Runtime target: Laravel Octane (the Laravel-side service that
  verifies inbound JWTs must remain Octane-safe).
