# service-accounts — SDUI blueprints

## Surfaces

Every SDUI screen here mounts on the `platform-admin` host + requires
authentication on the `platform_admin` guard. There is NO tenant-host SDUI in
this module — the token-exchange endpoint (`POST /api/v1/service-accounts/
token`) is a machine-to-machine JSON API with no user interface.

### `resources/service-account/`

Platform-admin CRUD + lifecycle surface for machine credentials.

- `list.screen.json` — filterable by application / tenant_scope / status /
  signer_kid; toggles for "include disabled" + "include expired". Shows
  rotation-due chip inline (highlighted when `is_expiring_soon` or
  `is_dormant`). Excludes soft-deleted rows unless `include_deleted=true`.
- `show.screen.json` — full detail card. Includes application + tenant
  breadcrumb, signer_kid + expiry + rotation history + usage histogram
  panel + suspicious-activity signal panel. Action bar with rotate /
  disable / delete / issue-test-jwt buttons gated on the caller's
  permissions.
- `create.screen.json` — form for the create flow. Composes
  `CreateServiceAccountInput`: pick application, optional tenant, name,
  description, optional signer_kid (or "provision fresh"), TTL. On submit,
  the response's `secret` field is rendered ONCE in a
  copy-to-clipboard-and-acknowledge dialog with an explicit "I've stored
  this in Doppler" confirmation.
- `rotate.screen.json` — rotation confirmation dialog. Requires reason
  (min 20 chars). On submit, same one-time secret display as create. UI
  explicitly names the fact that the new secret invalidates the previous
  one at the exchange-endpoint level but leaves existing JWTs valid until
  natural expiry.

### `widgets/`

- `service-account-status-chip.widget.json` — colour-coded chip for the
  four status values (pending / active / disabled / expired) + rotation-
  urgency overlay (expiring-soon = warning colour, expired = danger, dormant
  = muted-warning).
- `rotation-countdown.widget.json` — countdown timer for `expires_at`. Renders
  in the SA detail card + as a sortable column on the list surface.
- `service-account-audit-preview.widget.json` — compact 30-day audit
  preview: request-count histogram + distinct-IP-prefix count + jti-reuse
  count. Rendered on the show screen; heavy version is behind the
  audit-usage endpoint gated on `platform.service_accounts.view.audit_trail`.
- `signer-kid-badge.widget.json` — compact kid identifier with hover-
  reveal tooltip showing the kid's algorithm + creation date + whether it's
  shared with other SAs. Rendered in list column + detail card.

## SDUI patterns

- Every mutating action carries a `confirm` prop naming the operation +
  its side-effects (rotate = new secret returned; disable = existing JWTs
  keep working until exp; delete = 90-day retention hold).
- The plaintext secret is rendered in a MODAL with an explicit "Copy" +
  "I've stored this securely" acknowledgement flow. Modal cannot be
  dismissed by clicking outside — the user must acknowledge to close.
- Permission-gated buttons render as `null` when the caller lacks the
  ability — no disabled dead controls in the platform-admin UI.
- The confirm-copy for delete + rotate action explicitly names the
  compliance implications (rotation-required-for-security posture) so the
  invoking platform_admin cannot claim ambiguity.
- Audit-usage previews load lazily on tab activation to keep the initial
  detail-view fast; the heavy report (7d / 30d / 90d windows) is behind an
  explicit "Load full report" button.
