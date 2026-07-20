# identity/service-accounts — Phase 3 implementation status

## Status: PARTIAL — token exchange + observer + trust-boundary shape complete; platform CRUD + background jobs deferred

## What landed in this batch

### Trust-boundary (P0) — DONE

- `Actions/PublicExchange/CreateTokenAction.php` — bcrypt → HS256 JWT exchange.
  Constant-time secret compare, uniform failure payload for every branch
  (unknown SA / wrong secret / disabled / expired), rate-limit via
  `throttle:token-exchange` middleware, event dispatch on success.
- `Services/ServiceAccountJwtIssuer.php` — bridges the SA row (signer_kid,
  application_id, tenant_id) to `auth::JwtSigner`. `purpose = service_account`,
  fresh UUIDv4 jti per issuance via `random_bytes()` CSPRNG.
- `Observers/ServiceAccountObserver.php` — refuses `tenant_id` mutation on
  existing rows (blueprint invariant) via `saving()` hook. Same guard on
  `application_id`.
- `Concerns/IsServiceAccount.php` — lifecycle helpers (`isActive`, `isExpired`,
  `isDormant`, `resolveStatus`). Trait now composes cleanly on the model.
- `Models/ServiceAccount.php` — recomposed: `#[Hidden([SECRET_HASH])]`,
  `#[ObservedBy(ServiceAccountObserver)]`, `IsServiceAccount` trait wired.
- `Data/Requests/TokenExchangeRequestData.php` — Spatie DTO with
  `#[SensitiveParameter]` on `$secret`, regex-validated ULID, audience array,
  bounded TTL override.
- `Data/TokenIssuedData.php` — wire response mirroring blueprint §3.2.
- `Exceptions/ServiceAccountTenantMutationException.php` — new exception for the
  observer's guard.
- `config/service-accounts.php` — jwt / rotation / rate_limits / dormant /
  failure_disable knobs, all env-loaded via Doppler.

## Deferred

### Platform CRUD (still `return null` scaffolds)

| Action                       | Contract                                                 | Notes                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateServiceAccountAction` | `POST /api/v1/platform/service-accounts`                 | Provision a SA. Emit the plain rotation secret ONCE in the response body; persist only `secret_hash` (bcrypt cost 12). Fire `ServiceAccountCreated`. |
| `UpdateServiceAccountAction` | `PATCH /api/v1/platform/service-accounts/{sa}`           | Update name / description / metadata / expires_at. Observer refuses `tenant_id` + `application_id` mutation.                                         |
| `RotateSecretAction`         | `POST /api/v1/platform/service-accounts/{sa}/rotate`     | Rotate the secret. New plain secret returned in response body ONCE. Old secret is immediately unusable — `Hash::check` will fail.                    |
| `DeleteServiceAccountAction` | `DELETE /api/v1/platform/service-accounts/{sa}`          | Soft-delete. Observer sets deleted_at + tenant_id stays intact for the retention window.                                                             |
| `ShowServiceAccountAction`   | `GET /api/v1/platform/service-accounts/{sa}`             | Read.                                                                                                                                                |
| `ListServiceAccountAction`   | `GET /api/v1/platform/service-accounts`                  | Read with spatie query filters.                                                                                                                      |
| `IssueJwtAction`             | `POST /api/v1/platform/service-accounts/{sa}/issue-jwt`  | Dry-run token generation (60s TTL default). Fires `ServiceAccountJwtIssued` with `trigger='test'`.                                                   |
| `AuditUsageAction`           | `GET /api/v1/platform/service-accounts/{sa}/audit-usage` | Usage report — last N successful issuances + rate-limit hits + dormant window.                                                                       |

### Services that still need bodies

- `ServiceAccountProvisioner` — atomic create with immediate secret hash +
  metadata + audit-log entry.
- `SecretRotator` — bcrypt-hash rotation + `secret_rotated_at` bump + fires
  `ServiceAccountSecretRotated`.
- `RotationSchedulerService` — cron: T-14d before `expires_at` dispatch
  `NotifyRotationDueJob`.
- `DormantAccountDetector` — weekly scan: `last_used_at + dormant_days < now` →
  emit dormancy signal.
- `ServiceAccountFingerprinter` — IP + user-agent digest for anomaly detection.

### Background jobs

- `NotifyRotationDueJob` — 14-day warning to Application owner PlatformUsers.
- `RotateServiceAccountSecretJob` — auto-rotate for tenants that opt into
  automatic rotation.
- `DetectDormantServiceAccountJob` — weekly walker.
- `PurgeExpiredServiceAccountsJob` — daily hard-delete of rows past the
  retention hold.
- `UpdateLastUsedTimestampJob` — batched writer (called from the SA event
  listener; picks up every issuance in the queue and writes them in a single
  UPSERT).

### Middleware still to write

- `service_account.audit` — correlation_id + machine-context tags on every SA
  request.
- `service_account.verify_jwt` — composes `auth::JwtVerifier` + confirms SA is
  enabled + not expired.
- `service_account.enforce_scope` — rejects `app` / `tid` claim mismatches
  against request headers.

### Consoles still to fill

- `service-account:create` / `:list` / `:describe` / `:enable` / `:disable` /
  `:rotate` / `:delete` / `:test-jwt` / `:audit-usage` — same shape as
  finance/gateway commands; wrap the platform actions with clearer TTY output.

### Rate-limit registration

The `throttle:token-exchange` named limiter isn't yet registered. Add to
`AuthServiceProvider` (or a routing-package boot hook):

```php
RateLimiter::for('token-exchange', function (Request $request) {
    $saId = (string) $request->input('service_account_id', '');

    return [
        Limit::perMinute(5)->by('sa:' . $saId),
        Limit::perMinute(20)->by('ip:' . ($request->ip() ?? '0.0.0.0')),
    ];
});
```

### Test coverage outstanding

- Feature test on the exchange endpoint: happy path + every failure branch
  (unknown SA, wrong secret, disabled, expired, rate-limited).
- Unit test on `ServiceAccountJwtIssuer` mocking the signer + confirming the
  event payload shape.
- Observer test that `tenant_id` reparent attempts raise the correct exception.
- Round-trip test: exchange → verify JWT (via `auth::JwtVerifier`) succeeds.

## Follow-up handoffs

- `test-mutation-engineer` — trust boundary is a MUST for max mutation coverage.
  Priority: constant-time secret compare, IP-allowlist check (once wired),
  disable-on-N-failures counter, JWT emission event shape.
- `security-compliance-reviewer` — verify the "no enumeration signal" invariant
  across the full failure path (message + status code + response time). Time
  each branch and confirm they're within 5ms of each other.
