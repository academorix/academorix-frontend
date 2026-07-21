# auth — SDUI blueprints

## Surfaces

Auth ships two SDUI surfaces on the **platform-admin plane**
(`/api/v1/platform/*` routes). No tenant-facing SDUI is owned here — the tenant
surfaces (login form, MFA-enrol wizard, password-reset flow, session-management
screen) are owned by the SPA directly. Server-side templates aren't the right
shape for the login flow (Sanctum PAT plaintext must be received in-process, not
rendered in a templating layer).

### Platform-admin surfaces (owned by this module)

- `resources/session/` — session-management dashboard for platform-admin
  security ops. Filterable / revocable across all Users.
- `resources/jwt-signing-key/` — key management dashboard (list + rotate).
- `resources/impersonation/` — impersonation start + active-sessions view.

### Tenant surfaces (NOT owned by this module)

- Login form — SPA-owned. Renders POST /auth/login + branches on 202
  MfaChallengeResult vs 200 LoginResult.
- MFA-enrol wizard — SPA-owned. Renders the two-round preview + confirm flow.
- Password-reset flow — SPA-owned. Deep-linked from the emailed reset URL.
- Session-management ("My sessions") — SPA-owned. Consumes GET /auth/sessions
  - DELETE /auth/sessions/{id}.

## Widget composition

Every SDUI screen composes framework widgets from `framework/sdui` (Wave 2) plus
these auth-specific pieces (all under `widgets/`):

- `session-status-chip.widget.json` — colour-coded chip for active / expired /
  revoked / bulk-revoked states. Colours: green (active), gray (expired), yellow
  (revoked-by-user), red (revoked-by-admin-or-breach).
- `refresh-family-timeline.widget.json` — visual chain of a refresh family
  showing consume-events; reuse-detection breaches are highlighted red.
- `jwt-kid-badge.widget.json` — badge showing kid + application_id +
  active-vs-retired state.
- `impersonation-banner.widget.json` — the persistent banner shown in the SPA
  during an active impersonation session. Not literally an SDUI widget
  (SPA-rendered) — documented here for consistency.

## Screens (skeletal listing)

### `resources/session/list.screen.json`

- Header: "Active sessions" + filter bar (guard / application_id / user_id /
  tenant_id / date_range).
- Table columns: id, tokenable (User or PlatformUser), application_id, status
  chip, device_fingerprint_short, geolocation_hint, last_used_at, expires_at,
  actions (revoke).
- Empty state: "No sessions match the filters."
- Server-enforced permission: `platform.auth.sessions.viewAny`.

### `resources/session/show.screen.json`

- Header: "Session detail" + tokenable summary card.
- Session-info card: id, issued_at, expires_at, last_used_at, revoked_at (if
  any), reason (if revoked), device_fingerprint_short, geolocation_hint.
- Refresh-family panel: the `refresh-family-timeline` widget scoped to the
  session's family_id (if any). Highlights any reuse-detection events.
- Actions: Revoke (with confirmation + reason input).
- Server-enforced permission: `platform.auth.sessions.viewAny` (view),
  `platform.auth.sessions.revoke` (action).

### `resources/jwt-signing-key/list.screen.json`

- Header: "JWT signing keys" + tab bar (active / retired / all).
- Table columns: kid, application_id, algorithm, is_active, issued_at,
  rotated_at, retired_at, actions (rotate).
- Never shows: secret_encrypted (regulated_secret).
- Server-enforced permission: `platform.auth.jwt_keys.viewAny`.

### `resources/impersonation/active.screen.json`

- Header: "Active impersonation sessions" + refresh timer (gauge updates every
  60s).
- Table columns: impersonator_platform_user, target_user, target_application,
  reason (mandatory), started_at, session_expires_at, actions (end).
- Empty state: "No active impersonation sessions." (Positive state — the system
  is idle.)
- Server-enforced permission: `platform.auth.impersonate` (view + action).

## SDUI conventions

- Every action is server-enforced via the permissions declared in
  `policies.json` — the SDUI schema declares the button + hint text; the server
  refuses on missing permission with 403.
- Every mutating action (revoke, rotate, end-impersonation) requires a --reason
  input; the client-side widget enforces non-empty; the server writes reason to
  the audit log.
- Regulated_secret fields (secret_encrypted, token_hash) NEVER appear in the
  SDUI JSON payload response. The renderer receives redacted rows.

## When SDUI arrives

The SDUI JSON files themselves land alongside the code implementation in Wave
1a. This blueprint pins the SURFACE + widget composition + permission guards;
the concrete `.screen.json` files use the framework/sdui schema which lands in
Wave 2. If the code implementation of auth ships before framework/sdui, the
platform-admin surfaces render as vanilla HTML tables in a fallback mode; the
SDUI JSON files migrate them to the shared shape once available.

## Cross-references

- `modules/framework/blueprints/sdui/` — the SDUI schema itself (Wave 2).
- `modules/identity/blueprints/identity/sdui/readme.md` — sibling substrate
  module's SDUI notes (which redirect to auth's platform-admin surface for
  identity CRUD).
- `permissions.json` — every server-enforced permission that gates a button
  here.
