# ADR 0033 — Cross-service authentication contract: user JWT + machine `X-Service-Identity`

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Backend architecture +
Security lead **Companion:** [ADR-0032](0032-six-service-split.md)

## Context

ADR-0032 splits Stackra into six services (`identity`, `commerce`,
`notifications`, `observability`, `academorix-api`, `academorix-ai`). Every
inter-service call now crosses a process boundary + a container boundary +
sometimes a network boundary. Two auth flows must exist:

1. **User calls** — external clients (browser, mobile, machine-as-user)
   authenticate with a Sanctum PAT, then downstream services need to know who
   the caller is + what they can do without callbacks to identity per request.
2. **Machine calls** — services need to call each other for background work
   (commerce writes to observability's audit stream; notifications reads a
   User's contact preferences from identity). No user is present; the caller is
   the service itself acting under a machine identity.

The prior state:

- SDK packages under `packages/sdk/` + `packages/backend/sdk/` proposed a
  per-service PHP client that would carry the auth. Deleted in ADR-0032 —
  contract drift + coupling per bump made them a net negative.
- No canonical machine-identity model. `stackra-platform/application-sdk`
  discussed one, but the actual `service_accounts` table wasn't yet in place.
- No JWT contract. Each service could theoretically re-issue tokens locally,
  which would violate the "identity is the single issuer" invariant.

Three properties are required:

- **Local verification.** Every downstream service verifies inbound tokens
  without a network callback to identity. Verification is fast (<1 ms) and
  scales with the service, not with identity.
- **Short-lived per-hop tokens.** A leaked token is useful for at most 60
  seconds. Longer-lived credentials (PATs, machine identities) never leave
  identity in bearer form.
- **Signed, versionable, grep-able.** The wire format lives in
  `docs/contracts/*.schema.json` and every claim is documented.

## Options considered

### Option A — Sanctum PAT everywhere (rejected)

Every service accepts a Sanctum PAT + calls back to identity on every request to
resolve the caller.

**Rejected.** Every downstream request becomes an identity round-trip. Latency
adds up; identity becomes a per-request bottleneck; caching PAT lookups adds its
own consistency problems (revocation lag).

### Option B — Symmetric shared secret between service pairs (rejected)

Each pair of services shares an HMAC secret. Caller signs, callee verifies
against the shared secret.

**Rejected.** N services = N×(N-1)/2 secret pairs to manage. Rotation is a
coordinated dance. Adding a new service touches every existing service's Doppler
config.

### Option C — Asymmetric JWT via JWKS, identity is the sole issuer (chosen)

Identity is the sole issuer of every inter-service token. Every downstream
service fetches identity's public JWKS at boot + verifies signatures locally.
Two token shapes:

- **User JWT** — issued by identity's `POST /api/v1/auth/token` endpoint after a
  PAT + Application resolution. Carries user claims (sub, tenant, app, scope).
  Downstream services accept it directly.
- **`X-Service-Identity` header** — a JWT signed with the CALLING SERVICE's own
  keypair, whose public key is registered with identity. Carries service claims
  (sub = service_account slug, aud = target service, app).

**Chosen** because it delivers all three required properties (local verify,
short-lived, signed) without the operational burden of shared secrets.

### Option D — Full mTLS + certificate rotation (rejected)

Every service pair authenticates via mutual TLS. No JWT layer; identity is
authenticated at the transport layer.

**Rejected.** Complex operational story (cert rotation, cert pinning, PKI
management). Latency is higher (TLS handshake per request) unless we run a
service mesh. Overkill for the trust model — we're inside a private VPC. Reserve
for future consideration if we need transport-layer encryption guarantees a JWT
can't provide.

## Decision

### D1 — Identity is the sole issuer of user JWTs

Every user JWT is issued by `stackra-identity`'s `POST /api/v1/auth/token`
endpoint. The flow:

1. Client sends `Authorization: Bearer <sanctum-pat>` +
   `X-Application-Id: <slug>` to identity.
2. Identity resolves the PAT → User row → active Tenant → Application.
3. Identity mints a JWT signed HS256 with a per-Application key from Doppler.
4. Response body: `{ token: <jwt>, expires_in: 60 }`.
5. Client attaches the JWT as `Authorization: Bearer <jwt>` on downstream
   requests.

Token lifetime: **≤ 60 seconds**. Clients refresh via the same endpoint (using
the still-valid PAT) when the JWT nears expiry.

**HS256 vs. RS256.** We chose HS256 with a per-Application signing key held in
Doppler. Rationale:

- Every downstream service is inside our own trust boundary — asymmetric signing
  does not buy an outside-trust property here.
- Doppler is the source of truth for the shared secret; rotation is a Doppler
  operation, not a keypair regen.
- HS256 verify is ~5× faster than RS256 verify.

**JWKS endpoint.** Identity still publishes a JWKS document at
`/.well-known/jwks.json` for future-proofing (a public-audience surface, e.g. a
mobile app fetching the key set to verify tokens offline, may need it). Body
today is `{ keys: [<hs256-jwk>] }` with a `kid` per Application.

**Local verification.** Every downstream service fetches JWKS at boot + caches
it in Redis with a 5-minute TTL. Rotation lag ≤ 5 minutes.

### D2 — User JWT payload

```json
{
  "iss": "stackra-identity",
  "aud": "stackra-<target-service>",
  "sub": "usr_01H8XYZ...",
  "app": "sports",
  "tenant": "tnt_01H8XYZ...",
  "scope": "athletes.viewAny branches.viewAny facilities.viewAny",
  "iat": 1690000000,
  "exp": 1690000060,
  "jti": "jwt_01H8XYZ...",
  "kid": "app-sports-v1"
}
```

- `iss` — always `stackra-identity`.
- `aud` — the intended target service. Downstream services MUST reject tokens
  whose `aud` doesn't match `config('app.service_name')`.
- `sub` — the User's prefixed ULID.
- `app` — the Application slug (Sports / Marketplace / …). Every downstream
  service enforces `app == config('app.application_slug')` on tenant-scoped
  requests.
- `tenant` — the active Tenant's prefixed ULID.
- `scope` — space-separated permission slugs (matches `permissions.slug` in
  identity's DB). Downstream services enforce these via
  `#[RequirePermission(...)]` per the authorization contract.
- `iat` + `exp` — issued-at + expiry, seconds since epoch. `exp - iat ≤ 60`.
- `jti` — token ID for replay protection. Downstream services MAY track
  recently-seen `jti`s in Redis for a 60-second window.
- `kid` — key ID for signing key rotation. Format: `app-<slug>-v<n>`.

Full JSON Schema: `docs/contracts/service-jwt.schema.json` (added in a follow-up
commit).

### D3 — Machine calls use `X-Service-Identity` header (self-signed JWT)

Machine-to-machine calls (background jobs, cross-service webhooks) authenticate
with a `X-Service-Identity` header carrying a JWT signed by the CALLING
service's own HS256 key. The flow:

1. Caller (e.g. commerce) mints a self-signed JWT with its own HS256 key from
   Doppler. Payload includes
   `iss: stackra-commerce, aud: stackra- observability, sub: srv_commerce, app: sports, iat, exp, jti`.
2. Caller sends the JWT in `X-Service-Identity: <jwt>` (base64url-encoded).
3. Callee (observability) looks up the caller's public key in its bootstrap
   cache (fetched from identity at service boot).
4. Callee verifies the signature + enforces `aud == self`.

Machine tokens are short-lived (**≤ 60 seconds**) and cannot be reused across
services — each request mints a fresh one.

Full JSON Schema: `docs/contracts/service-identity.schema.json` (added in a
follow-up commit).

### D4 — `service_accounts` table lives in identity's DB

The identity service's `service_accounts` table stores every machine identity in
the workspace. Row shape (per ADR-0031 D1):

- `id` (prefixed ULID, `srv_`)
- `application_id` (required — machine identities are per-Application)
- `slug` (globally unique — `srv_commerce`, `srv_observability_writer`, …)
- `public_key` (JWK PEM, HS256-shared or RS256-public)
- `enabled` (bool)
- `created_at` / `updated_at` / `revoked_at`

The public keys are exposed at identity's
`GET /api/v1/service-accounts/ public-keys` endpoint. Every service fetches this
on boot + caches for 5 minutes.

Rotation:

- New key registered via identity's admin surface. `service_accounts` gets a new
  row for the same `slug` with a fresh `id`; the old row is marked
  `revoked_at = now()` after a grace window.
- Caller reads its new private key from Doppler + starts signing with it.
- Callees see the new public key on their next JWKS refresh.
- Lag ≤ 5 minutes end-to-end.

### D5 — Wire contracts live in `docs/contracts/`, not in SDK packages

Every cross-service payload shape is pinned by a JSON Schema in
`docs/contracts/`:

- `service-jwt.schema.json` — user JWT payload.
- `service-identity.schema.json` — `X-Service-Identity` JWT payload.
- `list-envelope.schema.json` — canonical list response.
- `single-envelope.schema.json` — canonical single-resource response.
- `error-envelope.schema.json` — canonical error response.

CI (per follow-up ADR on CI pipeline) runs each service's OpenAPI spec against
these schemas + fails the build on drift.

Typed clients (per-language) are generated from these schemas by downstream
tooling — this repo doesn't ship per-language SDK packages. Rationale (per
ADR-0032 D4): SDKs coupled every service to every other service's release
cadence; schemas decouple the wire from the client.

### D6 — `iat`, `exp`, `jti` are mandatory on every token

Every JWT — user and machine — MUST carry `iat`, `exp`, `jti`. Verification
enforces:

- `exp - iat ≤ 60` seconds.
- `iat` is not more than 5 seconds in the future (clock skew tolerance).
- `exp` is not in the past.
- `jti` has not been seen in the last 60 seconds (replay window).

Tokens missing any of these fields are rejected with `401 invalid_token`.

## Consequences

**Positive.**

- Local verification — no per-request callback to identity. Downstream services
  scale independently.
- Short-lived tokens — leaked tokens are useful for ≤ 60 seconds.
- Signed contracts — every claim is documented + versionable.
- Grep-able — every claim on the wire is answerable by reading
  `docs/contracts/*.schema.json`.
- Rotation is Doppler-driven — no code deploy needed to rotate a signing key.

**Negative.**

- Every service must implement JWT verify. Standard libraries exist per language
  (firebase/php-jwt for Laravel, jsonwebtoken for Node); still operational work.
- JWKS caching + rotation is a runbook item. A stale cache after a rotation
  window causes verification failures — mitigated by the 5-minute cache TTL.
- `jti` replay-protection requires Redis. Every service already runs Redis
  (Horizon, session storage); no new dependency.
- Clock skew must be handled — 5-second tolerance on `iat` is standard.
- The 60-second window forces clients to refresh often. Mitigated by the refresh
  endpoint accepting the still-valid PAT.

**Neutral.**

- The user JWT + machine header are TWO different auth layers. Reviewers must
  distinguish them in every controller. The `authorization` package already
  handles this via `#[RequirePermission(...)]` on user calls +
  `#[RequireServiceIdentity(...)]` on machine calls (planned attribute).

## Follow-up work

Execution lives in future commits:

- **Schemas already exist** at
  [`docs/contracts/*.v1.schema.json`](../contracts/):
  - [`service-jwt.v1.schema.json`](../contracts/service-jwt.v1.schema.json) —
    payload for both `Authorization: Bearer` (identity-issued user token,
    `iss=stackra-identity`) and `X-Service-Identity` (self-signed machine token,
    `iss=<caller-service>`). Same shape, different `iss` claim + different HTTP
    header per call kind.
  - [`service-identity.v1.schema.json`](../contracts/service-identity.v1.schema.json)
    — Sanctum PAT + ServiceAccount projection Laravel returns from
    `GET /api/v1/service-accounts/me`.
  - [`list-envelope.v1.schema.json`](../contracts/list-envelope.v1.schema.json) +
    [`single-envelope.v1.schema.json`](../contracts/single-envelope.v1.schema.json) +
    [`error-envelope.v1.schema.json`](../contracts/error-envelope.v1.schema.json)
    — the three Seam-3 data envelopes.
  - [`service-jwt.v1.md`](../contracts/service-jwt.v1.md) — the 13-step verifier
    order (extraction → alg/typ enforcement → constant-time HMAC → exp / iat /
    duration guards → aud / iss / tenant_id checks → optional replay
    prevention).
- **Extend service-jwt.v1.schema.json** — add the optional `kid` field for
  per-Application key rotation (patch bump — safe additive). The existing schema
  supports one shared `SERVICE_JWT_SIGNING_KEY` from Doppler; ADR-0033 layers
  per-Application `kid` rotation on top when the identity plane needs it.
- **Identity's `POST /api/v1/auth/token` endpoint** — JWT issuance.
- **Identity's `GET /.well-known/jwks.json`** — JWKS publish.
- **Identity's `GET /api/v1/service-accounts/public-keys`** — service- account
  public key registry.
- **`packages/backend/authorization`** — extend with `VerifyServiceJwt` +
  `VerifyServiceIdentity` middleware + `#[RequireServiceIdentity(...)]`
  attribute.
- **Per-service JWKS cache** — Redis-backed with 5-minute TTL.

## Related work

- ADR-0022 — Language-agnostic service boundary (the four seams). The user JWT
  is Seam 2; the `X-Service-Identity` header is Seam 1.
- ADR-0027 — Row-level attribution: three axes. The JWT's `app` + `tenant`
  claims cascade to `application_id` + `tenant_id` on downstream writes.
- ADR-0031 — `application_id` central-plane extension. `service_accounts`
  - `auth_jwt_signing_keys` are two of the four rows the extension adds.
- ADR-0032 — Six-service split (Option B). This ADR is the auth companion.
- `.kiro/steering/hierarchy.md §12` — the service split this ADR unlocks.
- `docs/services.md §4` — the cross-service auth section that anchors here.
- `docs/contracts/README.md` — the wire-contract narrative (added in a follow-up
  commit).
