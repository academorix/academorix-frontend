# Services — the six-service topology

**Status:** Accepted **Anchor ADR:**
[ADR-0032](adr/0032-six-service-split.md) **Companion ADR (auth boundary):**
[ADR-0033](adr/0033-cross-service-authentication-contract.md) **Steering:**
[hierarchy.md §12](../.kiro/steering/hierarchy.md#12-service-split)

Stackra is deployed as **six independent Laravel Octane services**. Four are
SHARED across every Stackra product; two are ONE-DEPLOYMENT-PER-APPLICATION
(Sports / Marketplace / …). This document is the operational contract for that
split — what runs where, who owns which row, and how the six services talk to
each other.

Read alongside `hierarchy.md` for the platform tree, `tenancy-columns.md` for
the three-axis row-attribution contract, and the ADRs above for the
architectural rationale.

## 1. The six services

| Service                      | Deployment shape           | Runtime home         | Composer name (deployable app) |
| ---------------------------- | -------------------------- | -------------------- | ------------------------------ |
| **`stackra-identity`**       | SHARED (one per workspace) | `services/identity/` | `stackra/identity-service`     |
| **`stackra-commerce`**       | SHARED (one per workspace) | `services/commerce/` | `stackra/commerce-service`     |
| **`stackra-notifications`**  | SHARED (one per workspace) | `services/notifications/` | `stackra/notifications-service` |
| **`stackra-observability`**  | SHARED (one per workspace) | `services/observability/` | `stackra/observability-service` |
| **`academorix-api`**         | PER-APPLICATION            | `apps/academorix/`   | `stackra/api` (academorix product) |
| **`academorix-ai`**          | PER-APPLICATION (optional) | `apps/academorix-ai/` | (planned)                      |

Each service is a self-contained Laravel app:

- Its own Doppler config (`stackra-<service>` / `dev_<service>`).
- Its own container image (`docker/<service>.Dockerfile`).
- Its own Redis + Postgres cluster identity in production (cluster names differ
  by service; a single shared cluster is acceptable for dev / staging).
- Its own Horizon supervisor + queue set.
- Its own `bootstrap/app.php` + `bootstrap/providers.php`.
- Its own migrations for the packages it owns — no cross-service DDL.

## 2. Ownership map

Every backend package under `packages/backend/**` belongs to exactly ONE
service. That service is the sole write path for the package's rows and the
sole home for its migrations. The framework tier (foundation, framework/\*,
shared/\* substrate, telemetry, authorization, architecture rules) is EMBEDDED
in every service — those packages don't own persistent rows.

### `stackra-identity`

Owns the identity plane. Cross-Application, one deployment.

- `platform/application` — Application registry, JWKS keyring, OAuth clients.
- `platform/tenancy` — Tenant + TenantContact.
- `platform/credentials` — external credential vault.
- `identity/identity` — global credentials (Identity row per real human).
- `identity/auth` — login, refresh, cross-app SSO grants, JWT issuance.
- `identity/mfa` — TOTP + recovery codes.
- `identity/user` — per-Application User (Identity × Application).
- `identity/people` — Profile satellite (name, phone, avatar, locale, tz).
- `identity/platform-user` — central-admin plane (`platform_admin` guard).
- `identity/service-accounts` — machine credentials + Sanctum PATs.
- `access/rbac` — Roles + Permissions storage (heavy implementation).
- `access/invitations` — onboarding invites.
- `access/grants` — explicit permission grants.
- `access/delegation` — temporary act-as / delegation.
- `access/requests` — access-request approvals.

**Why one service, not four:** every write in this plane is atomic across the
whole plane. Creating a Tenant + owner User + default Roles + first Session is
one transaction. Provisioning-atomicity + JWT-issuance-locality make co-location
non-negotiable — see steering §12 non-goals.

### `stackra-commerce`

Owns the money + capability plane. Cross-Application, one deployment.

- `billing/subscription` — TenantSubscription (Paddle mirror, coupons,
  chargebacks, credit memos, transactions, refunds).
- `billing/entitlements` — Feature flags, slot quotas, token pools, license
  grants, `EntitlementGate` runtime.

**Why co-located:** every Subscription change fires an entitlement recalc.
Splitting them forces a distributed transaction (Subscription writes here,
Entitlements writes there) that can't be undone without compensating writes.

### `stackra-notifications`

Owns multi-channel fan-out. Cross-Application, one deployment.

- `notifications/notifications` — dispatcher + channel registry.
- `notifications/notifications-in-app` — bell + inbox.
- `notifications/notifications-mail` — transactional email.
- `notifications/notifications-push` — Web-push / APNs / FCM.
- `notifications/notifications-sms` — SMS gateway.
- `notifications/messaging` — chat + threads.
- `notifications/announcements` — broadcast bulletins.
- `notifications/newsletter` — marketing / newsletter workflows.

**Why co-located:** the dispatcher + channels share a common preference model
(`NotifiablePreference`) that would otherwise need to be duplicated per channel
service. One service, five channel providers behind one contract.

### `stackra-observability`

Owns audit + activity + monitoring + compliance evidence + retention.
Cross-Application, one deployment.

- `observability/audit` — compliance signal (owen-it/laravel-auditing).
- `observability/activity` — product feed (spatie/laravel-activitylog).
- `observability/monitoring` — health metrics + trace collector.
- `compliance/compliance` — regime evidence surface (GDPR / PCI / SOC-2
  accessors).
- `compliance/retention` — retention runner (prunes audit + activity per tier).

**Why co-located:** the retention runner reads BOTH audit and activity rows, +
the compliance evidence surface renders both. Splitting these forces the
retention runner to read across service DB boundaries.

### `academorix-api` — per-Application backend

Owns physical hierarchy + all product-specific domain modules + safeguarding.
ONE DEPLOYMENT PER APPLICATION. Sports today; Marketplace, Ticketing, Venue,
Education tomorrow — each gets its own deployment.

**Framework-level (`packages/backend/platform/*`):**

- Region, Organization, Branch, Facility
- Teams, Staff, Reception
- Reporting (materialised-view rollups)
- Branding, Theme, Domains
- Integrations, Public-site, Forms
- Webhook (outbound per tenant)
- Realtime (WebSocket broadcaster)
- Storage (per-tenant file storage)
- Admin console (API surface)

**Workflow (`packages/backend/workflow/*`):**

- Approvals, Tasks

**Academorix domain (`apps/academorix/src/modules/*`):**

- `platform/safeguarding` (moved 2026-07-21 out of the shared platform packages)
- `sports/*` — athletes, teams, seasons, events, coaching, competitions, drills,
  performance, etc.
- `finance/*` — payment, invoicing, membership, dunning, wallet, refunds
- `growth/*` — leads, marketing, referral
- `products/*` — course + product catalogue

**Why per-Application:** domain modules are, by definition, product-specific.
Sports' Athlete model has zero meaning to Marketplace. Every backend deployment
carries only the domain modules its product needs.

### `academorix-ai` — per-Application AI runtime

Optional per Application. Standalone process — different SLA (bursty) + scale
profile (GPU / high-memory) than the transactional API.

- `platform/ai` — Persona registry + tools + draft-then-confirm orchestrator.

**Why isolated:** LLM provider outages should not affect the transactional API.
An OpenAI 503 must NOT take down `/api/v1/branches`.

## 3. Framework tier — embedded in every service

The framework tier is NOT a service — it's the shared runtime substrate every
service links against via Composer path repositories.

- **Foundation** — `packages/backend/foundation`, `packages/backend/shared/foundation`
- **Framework** — `packages/backend/framework/{caching, console, container, crud, database, enum, events, exceptions, feature-flags, routing, scheduling, scope, serializer, service-provider, settings, support}`
- **Shared substrate** — `packages/backend/shared/{attributes, geography, localization, offline-sync, search, transfer, versioning}`
- **Telemetry** — `packages/backend/telemetry/{debug-bar, health, horizon, nightwatch, sentry}`
- **Authorization** — `packages/backend/authorization` (light contract-implementer split, per ADR-0008)
- **Arch guards** — `packages/backend/compliance/architecture` (PHPStan rules)
- **Monitoring** — `packages/backend/observability/monitoring` (each service emits its own health + metrics)

Every service's `composer.json` requires these plus its own domain tier. Every
service ships them via `symlink: true` path repositories under
`packages/backend/**`.

## 4. Cross-service auth boundary

Two independent auth flows, per ADR-0033.

### User calls (external → service)

1. Client sends `Authorization: Bearer <sanctum-pat>` +
   `X-Application-Id: <slug>` to `stackra-identity`.
2. `stackra-identity` verifies the PAT against `personal_access_tokens`,
   resolves the tenant + Application, and mints a short-lived JWT
   (HS256, exp ≤ 60 s) signed with a per-Application key from Doppler.
3. Every downstream service (commerce, notifications, observability,
   academorix-api) receives the JWT via `Authorization: Bearer <jwt>` +
   verifies locally against JWKS (fetched at boot from
   `stackra-identity`'s `.well-known/jwks.json`).
4. No per-request callback to `stackra-identity`. The JWT carries `sub`
   (User), `app` (Application), `tenant` (Tenant), `scope` (space-separated
   permissions).

### Machine calls (service → service)

1. Caller service holds a `service_account` credential (identity table
   in `stackra-identity`) + its Doppler-provisioned HS256 signing secret.
2. Caller sends `X-Service-Identity: <base64url-signed-jwt>` — payload:
   `{iss: <caller>, aud: <target>, sub: <service_account_slug>, app, iat,
   exp, jti}`.
3. Target service verifies the signature with the caller's public key
   (fetched from `stackra-identity` on boot) + enforces `aud == self`.
4. Zero-user calls. No shared secret between service pairs; every trust
   edge is signed by identity's per-Application keypair.

Full contract in
[`docs/contracts/service-jwt.schema.json`](contracts/service-jwt.schema.json)
and
[`docs/contracts/service-identity.schema.json`](contracts/service-identity.schema.json).

## 5. Data ownership + cascade paths

Every persisted row belongs to exactly ONE service. Cross-service reads happen
over HTTP; there are no cross-service database joins.

| Row (canonical location)     | Owning service          | How other services read it   |
| ---------------------------- | ----------------------- | ---------------------------- |
| `applications`               | `stackra-identity`      | JWT `app` claim              |
| `tenants`                    | `stackra-identity`      | JWT `tenant` claim           |
| `users`                      | `stackra-identity`      | JWT `sub` claim              |
| `identities`                 | `stackra-identity`      | never — internal to identity |
| `roles`, `permissions`       | `stackra-identity`      | JWT `scope` claim            |
| `service_accounts`           | `stackra-identity`      | JWKS + X-Service-Identity    |
| `auth_jwt_signing_keys`      | `stackra-identity`      | `.well-known/jwks.json`      |
| `tenant_subscriptions`       | `stackra-commerce`      | `GET /commerce/subscriptions/current` |
| `entitlement_licenses`       | `stackra-commerce`      | `GET /commerce/entitlements/current`  |
| `plans`                      | `stackra-commerce`      | `GET /commerce/plans`         |
| `notifications`              | `stackra-notifications` | `POST /notifications/dispatch` |
| `audits`                     | `stackra-observability` | `GET /observability/audits`   |
| `activity_log`               | `stackra-observability` | `GET /observability/activity` |
| `branches`, `facilities`, `teams`, `staff`, … | `academorix-api` | product-specific HTTP surface |

Cascading through the axes (`tenant_id → tenants.application_id`) still holds
INSIDE the identity DB; other services cache the `(user, tenant, application)`
triple from the JWT and don't need the join.

## 6. Deployment topology

```
                                ┌────────────────────────────────────────┐
                                │            Doppler                     │
                                │  stackra-identity, stackra-commerce,   │
                                │  stackra-notifications,                │
                                │  stackra-observability,                │
                                │  stackra-academorix-api,               │
                                │  stackra-academorix-ai                 │
                                └────────────┬───────────────────────────┘
                                             │ secrets
                                             ▼
       ┌─────────────────┐            ┌─────────────────────────────────┐
       │   HTTP client   ├───PAT─────▶│   stackra-identity              │
       │   (browser)     │            │   (Sanctum PAT verify + JWT     │
       └────────┬────────┘            │    issuance + JWKS publish)     │
                │                     └───────────┬─────────────────────┘
                │                                 │ JWT signing keys
                │ JWT                             │
                │                     ┌───────────┼─────────────────────┐
                ▼                     ▼           ▼                     ▼
       ┌─────────────────┐  ┌─────────────┐  ┌────────────────┐  ┌───────────────┐
       │ academorix-api  │  │ commerce    │  │ notifications  │  │ observability │
       │  (per-App)      │  │   service   │  │   service      │  │   service     │
       └────┬────────────┘  └──────┬──────┘  └───────┬────────┘  └───────┬───────┘
            │                      │                 │                   │
            │  audit/activity events (async, HS256-signed X-Service-Identity)
            │──────────────────────┴─────────────────┴───────────────────┘
                                                     ▲
                                                     │
                                              ┌──────┴────────┐
                                              │ academorix-ai │
                                              │  (per-App)    │
                                              └───────────────┘
```

Every arrow is HTTP with a JWT or an HS256-signed header. There are no direct
service-to-service DB connections.

## 7. Local development

Each service can boot standalone via its own `.doppler.yaml`. The developer
runs one service at a time by default; multi-service scenarios are handled by
`docker compose up identity commerce academorix-api` from the workspace root.

### First-time bootstrap

```bash
cd services/identity
composer install
doppler run -- php artisan key:generate
doppler run -- php artisan migrate --seed
doppler run -- php artisan octane:start --workers=2 --port=8001

cd ../commerce
composer install
doppler run -- php artisan key:generate
doppler run -- php artisan migrate --seed
doppler run -- php artisan octane:start --workers=2 --port=8002

# … repeat for notifications (8003), observability (8004), academorix-api (8000)
```

### Multi-service dev via docker compose

```bash
docker compose -f docker/compose.dev.yml up identity commerce academorix-api
```

The compose file (added in a follow-up commit) wires each service's Doppler
service token, exposes each on its canonical port, and shares a single Redis
+ Postgres cluster for developer ergonomics.

## 8. Migration + release cadence

- **Identity** — highest care. Every schema change goes through ADR + user
  migration walkthrough. Zero-downtime deployment required (blue/green).
- **Commerce** — same care as identity. Subscription writes are transactional.
- **Notifications** — high care (delivery guarantees), low churn.
- **Observability** — retention-window changes require ADR.
- **academorix-api** — normal Laravel deployment cadence. Every product
  deployment is independent.
- **academorix-ai** — bursty scale. Deployed / scaled independently of
  academorix-api. LLM provider outages contained here.

## 9. What's NOT here

- **Web / mobile clients** — separate repos (or subfolders — see
  `packages/frontend/` + `apps/react-native-template/` + `apps/vite-template/`).
- **SDKs** — deleted 2026-07-21 (see ADR-0032). Cross-service contracts live
  in `docs/contracts/*.schema.json`, not in per-service SDK packages.
- **Shared audit / activity / telemetry substrate** — deleted 2026-07-21 (was
  `packages/backend/shared/{audit,activity,telemetry}`); superseded by the
  observability service's owned packages.

## 10. References

- ADR-0032 — Six-service split (Option B).
- ADR-0033 — Cross-service authentication contract.
- ADR-0022 — Language-agnostic service boundary (the four seams that make the
  six-service split possible).
- ADR-0027 — Row-level attribution: three axes.
- ADR-0031 — `application_id` extension for central-plane infrastructure.
- ADR-0034 — Runtime target: Laravel Octane (Swoole driver).
- `.kiro/steering/hierarchy.md` — the platform tree.
- `.kiro/steering/tenancy-columns.md` — row-level attribution rules.
- `docs/contracts/service-identity.schema.json` — machine-credential contract.
- `docs/contracts/service-jwt.schema.json` — cross-service JWT contract.
