---
inclusion: manual
---

# Service boundary

Pull in via `#service-boundary` from any spec that adds a deployable (a new
`apps/*` entry), introduces a new cross-service call, or proposes a new language
for any service.

Full narrative: `docs/service-boundary.md`. Decision:
`docs/adr/0022-language-agnostic-service-boundary.md`. Machine-readable
contracts: `docs/contracts/`.

## The rule

Academorix is polyglot on purpose — **Laravel for the tenant business API,
Python for AI/ML.** Keep it that way. Do not propose consolidating the backend
onto Python, and do not propose rewriting it in Go. A new _language_ for a
service is allowed only with **profiling evidence** that the existing stack
can't meet the requirement, and even then it is added _alongside_ Laravel as its
own service — never as a replacement.

Every deployable, in any language, integrates through exactly four seams and
nothing else:

1. **Identity** — a row in Laravel's `service_accounts` table + one Sanctum PAT
   with a minimal, explicit ability set (default-deny). Laravel is the single
   source of truth for authz. Never invent a parallel auth scheme. Contract:
   `docs/contracts/service-identity.schema.json`.
2. **Inbound trust** — verify the short-lived HS256 service JWT on calls from
   other services: signature (constant-time), `exp`/`iat` (30s skew), `aud` ==
   own slug, non-empty `iss`/`tenant_id`. Contract:
   `docs/contracts/service-jwt.schema.json`.
3. **Data** — speak the shared wire shapes only: Kafka topic schemas
   (`academorix-ai/packages/topics`) + shared DTOs (`packages/domain` /
   `academorix/*` models). Never reach into another service's database directly.
4. **Observability** — propagate `X-Correlation-Id` (+ `traceparent` on Kafka)
   and emit the standard structured-log shape (`timestamp`, `level`, `service`,
   `tenant_id`, `trace_id`, `span_id`, `message`). Expose `/health` + `/ready`.

## When reviewing or writing a spec

- **Default to a package, not an app.** An app needs a distinct HTTP surface,
  runtime profile, release cadence, or deployment isolation (see
  `docs/architecture.md`). A new language needs profiling evidence on top of
  that.
- **Contracts are the source of truth.** Generate verifiers/DTOs from
  `docs/contracts/*.json`; never hand-copy shapes. Adding an optional field is
  safe; renaming/removing one or tightening a constraint is a breaking change
  requiring a coordinated PHP + Python rollout.
- **Signature scheme is fixed** — HS256 over a `>=32`-byte Doppler secret;
  refuse to boot on a weak/short secret.
- **Every cross-service token is tenant-scoped.** No `tenant_id`, no trust.
- Follow the "Adding a new service" checklist in `docs/service-boundary.md`.

## Do not

- Do not build `apps/stream-gateway` (or any speculative hot-path service)
  without profiling evidence. The _contract_ exists so the _service_ can be
  added later as a bounded task, not so it can be added now.
- Do not proxy end-user tokens between services — each service uses its own
  identity.
- Do not add a bespoke header or side channel between services; extend a
  documented contract instead.
