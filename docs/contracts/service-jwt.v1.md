# Service JWT — 13-step verification order

**Anchor:** [ADR-0022](../adr/0022-language-agnostic-service-boundary.md).
**Schema:** [`service-jwt.v1.schema.json`](service-jwt.v1.schema.json).

Every Seam 2 (inbound trust) JWT MUST be verified in the exact order below.
Steps are ordered so the cheapest failures short-circuit first and no
cryptographic verification runs against malformed input.

Any step that fails aborts the verification and returns `401 Unauthorized` with
`{ "message": "invalid service token" }` — never leak WHICH step failed to the
caller. Log the failing step + reason server-side for ops.

## Steps

### Step 1 — Extract the token from the Authorization header

Header shape: `Authorization: Bearer <token>`. Reject any other scheme (`Basic`,
`Digest`, missing prefix). Empty token → fail.

### Step 2 — Split the JWT into three base64url-encoded parts

Format: `<header>.<payload>.<signature>`. Missing any part → fail. Non-base64url
characters → fail.

### Step 3 — Decode the header

Parse the base64url-decoded header as JSON. Reject if not a JSON object.

### Step 4 — Enforce `alg == "HS256"` and `typ == "JWT"`

- `alg`: reject anything except `"HS256"`. Reject `"none"` explicitly (defense
  against the CVE-2015-9235 class).
- `typ`: reject anything except `"JWT"`.

This is Contract Rule 2 — the signature scheme is fixed. Changing it requires a
schema major bump + coordinated rollout.

### Step 5 — Verify the signature (constant-time)

Recompute HMAC-SHA256 over `<header>.<payload>` using the
`SERVICE_JWT_SIGNING_KEY` from Doppler. Compare the recomputed signature to the
token's signature using a **constant-time** comparison (`hash_equals()` in PHP,
`hmac.compare_digest()` in Python). Never use `===` / `==`.

Refuse to boot the process if the Doppler secret is missing OR shorter than 32
bytes.

### Step 6 — Reject if `exp <= now - 30`

`exp` is a Unix epoch integer. `now` is the server's UTC epoch time. 30-second
clock-skew tolerance allows for reasonable NTP drift between issuer and
receiver.

### Step 7 — Reject if `iat > now + 30`

Same skew tolerance in the opposite direction. Rejects tokens issued in the
future (clock-skew attacks, misconfigured issuer).

### Step 8 — Reject if `exp - iat > 60`

Seam 2 tokens are SHORT-LIVED. Any token with a validity window longer than 60
seconds is suspicious — reject even if the signature verifies.

### Step 9 — Verify `aud == own_service_slug`

The receiver's own service slug (from Doppler `SERVICE_SLUG` or similar) MUST
match the token's `aud` claim exactly. Case-sensitive.

### Step 10 — Verify `iss` is non-empty

Empty `iss` → fail. Empty issuer is a schema violation.

### Step 11 — Verify `iss` is a known peer

The receiver maintains an allow-list of peer service slugs (in Doppler or a
config file). If `iss` isn't in the allow-list → fail. This is the defense
against a compromised worker in service X signing tokens claiming to be service
Y (same shared secret, but a different `iss` slug).

### Step 12 — Verify `tenant_id` is non-empty

Missing or empty `tenant_id` → fail. Contract Rule 4 — every cross-service token
is tenant-scoped.

### Step 13 — Verify `tenant_id` exists

Query the tenants table (with a short cache) — reject if the `tenant_id` doesn't
resolve to a known, non-suspended tenant.

### Step 14 (optional) — Replay prevention

Track seen `jti` values in a short-lived cache (Redis, keyed by `jti`, TTL =
`exp - now`). If the `jti` was seen already, reject. Optional because Seam 2
tokens are already short-lived; replay prevention adds defense-in-depth for
high-value operations.

## Failure logging

Every failure logs the failing step + a redacted reason:

```jsonc
{
  "timestamp": "...",
  "level": "warning",
  "service": "<own slug>",
  "message": "service jwt verification failed",
  "step": 9,
  "reason": "aud mismatch",
  "iss_claimed": "api",
  "aud_claimed": "wrong-service",
}
```

Never log the full token, the signature, or the signing key.

## Language bindings

- **PHP** — `packages/backend/identity/auth/src/Services/ServiceJwtVerifier.php`
  (planned per `.kiro/reports/00-triage-summary-2026-07-21.md` §Missing
  infrastructure I1).
- **Python** — `stackra-ai/packages/security/service_jwt_verifier.py` (planned).
- **Go** (future) — package `serviceauth` under the new service.

Every binding implements the 13 steps in order. Every binding has a test suite
that exercises each step's failure case independently.

## Cross-references

- [ADR-0022](../adr/0022-language-agnostic-service-boundary.md) — the seam
  definition.
- [`service-jwt.v1.schema.json`](service-jwt.v1.schema.json) — the payload
  schema.
- [`docs/contracts/README.md`](README.md) — the five contract rules.
- [`docs/service-boundary.md`](../service-boundary.md) — the narrative
  walkthrough.
