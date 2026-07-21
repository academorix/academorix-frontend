# delegation — SDUI blueprints

## Surfaces

Two audience-scoped surfaces mirroring the module's two hosts.

### `resources/role-delegation/` (tenant host, `sanctum` guard)

Tenant-facing delegation management.

- `list.screen.json` — tenant member's own outbound + inbound delegations. Split
  into two tables: "I'm delegating out" and "Delegated to me". Each row shows
  the state chip, delegation type, role or "All roles" label, delegate /
  delegator identity, window, and remaining time (for active rows).
- `create.screen.json` — delegator picks the delegate + optional role +
  starts_at / ends_at + delegation type + reason. Live validation surfaces every
  rule from `rules.json` (window validity, delegator holds the role,
  same-tenant, reason min length, emergency-flow entitlement check).
- `show.screen.json` — full detail: delegator + delegate profile cards, role
  info, dates, current state, activity log preview. Delegator sees a "revoke
  early" button (per policy).

### `resources/impersonation-session/` (platform-admin host, `platform_admin` guard)

Platform-admin impersonation surface. Every screen requires MFA-mandatory
(inherited from platform.mfa_required middleware) + the `platform.impersonate`
permission at minimum.

- `list.screen.json` — active + recent impersonation sessions across all tenants
  (scoped to caller's own for regular support agents; cross-tenant for
  security + super_admin). Toolbar filters by target_tenant + operator +
  active-only.
- `start.screen.json` — the operator's session-start form. Fields: target
  tenant + target user picker (searchable), target application, reason (40-char
  minimum, live counter), support_ticket_reference (optional), TTL duration
  (default 60 min slider, capped at 60 unless extended-TTL entitlement is
  enabled on the target tenant), is_read_only toggle (disabled unless the target
  tenant holds `read_only_impersonation`). On submit, the response includes the
  raw impersonation PAT which the client swaps into its session storage for the
  session's lifetime.
- `show.screen.json` — session detail with a real-time countdown timer widget
  (via the platform.impersonation.{platform_user_id} broadcast), the audit trail
  preview (last 50 rows keyed to the session's correlation_id), and operator
  actions (end session, extend session for super_admin, force- terminate for
  security).
- `audit-report.screen.json` — cross-tenant compliance evidence report. THE SOC
  2 evidence read — auditors traverse this screen during review. Filterable by
  target tenant, operator, date range, end_trigger, department. Exports CSV +
  JSON.

### `widgets/`

- `delegation-status-chip.widget.json` — colour-coded chip for the four
  effective delegation states (pending / active / expired / revoked). Used in
  every list + show screen + in the shell's "delegate-received" indicator.
- `impersonation-active-banner.widget.json` — top-of-page banner shown to the
  operator during an active impersonation session. Displays impersonated User
  identity + read-only badge (if applicable) + countdown timer + "End session"
  button.
- `impersonation-countdown-timer.widget.json` — self-updating timer widget.
  Subscribes to the `platform.impersonation.{platform_user_id}` broadcast so
  extensions + force-terminations propagate in real time.
- `delegation-scope-badge.widget.json` — small badge shown next to a role name
  when the caller is currently exercising a delegation for that role. Example:
  "Finance Manager (via Alice)" in the shell nav.

## SDUI patterns

- Every mutating action carries a `confirm` prop with a jargon-free description
  of what changes. Delegation revoke prompts confirm the effect (immediate);
  impersonation force-terminate prompts confirm the security-lockdown severity
  - notifies the security team.
- Permission-gated buttons render as `null` when the caller lacks the ability —
  no disabled dead controls.
- Impersonation session PAT is returned ONCE on start; the client is responsible
  for immediately swapping it into session storage + the start.screen never
  redisplays it. Copy-to-clipboard is deliberately omitted (no reason to persist
  the raw PAT anywhere but session state).
- The impersonation-active-banner uses `variant="warning"` intentionally — the
  operator should always be visually aware they are acting as another user.
- The audit-report screen renders `impersonator_display_name` from snapshot
  fields when the FK is NULL (post PlatformUser hard-delete). No "unknown
  operator" ever appears — the snapshot is the fallback.
