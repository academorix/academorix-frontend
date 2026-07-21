# mfa — SDUI blueprints

## Surfaces

### `resources/mfa/`

Tenant self-service MFA management panel. This is where users enrol / disable
MFA, manage WebAuthn credentials, and regenerate recovery codes.

- `panel.screen.json` — the primary /me/mfa panel. Shows the caller's
  MFA-methods summary at the top (via the `MfaMethodsSummary` widget), then
  tabbed sections for TOTP / Passkeys / Recovery Codes. Feature-gated per
  entitlement (WebAuthn tab hidden without `mfa_webauthn`).
- `totp-enroll.screen.json` — the two-round enrolment wizard. Round 1 renders
  the QR code + secret; round 2 collects the 6-digit code.
- `webauthn-register.screen.json` — WebAuthn registration flow. Client-side
  JavaScript orchestrates `navigator.credentials.create()`; this screen captures
  the device_name + shows the confirmation.
- `webauthn-credentials-list.screen.json` — table of registered credentials with
  rename / disable / delete actions.
- `recovery-codes.screen.json` — display current codes (via the
  `RecoveryCodesReveal` widget which handles single-shot rendering) +
  regenerate + download CTAs.
- `challenge.screen.json` — the mid-session step-up challenge dialog. Rendered
  in a Modal, not a full page. Auto-focuses the appropriate input based on the
  caller's preferred method.

### `resources/webauthn-credential/`

Platform-admin surface for viewing a user's WebAuthn credentials during support
/ incident-response.

- `list.screen.json` — read-only table of a user's registered credentials.
  Filter: include disabled? Show AAGUID? PII fields (AAGUID + full transports)
  gated behind `platform.mfa.methods.view.pii` permission.
- `show.screen.json` — one credential's detail. Never shows credential_id_b64url
  or public_key; renders device_name + attestation format + transports +
  sign_count + timestamps.

### `widgets/`

- `mfa-methods-summary.widget.json` — the top-of-panel summary card. Shows TOTP
  badge, WebAuthn credential count, recovery-codes-remaining ring chart (colour
  flips red when below threshold). Data-driven from `MfaMethodsSummary` DTO.
- `mfa-status-chip.widget.json` — small status chip rendered next to a User's
  name in admin lists. "MFA required" (yellow), "MFA active" (green), "MFA
  disabled" (red), "MFA in grace period" (blue).
- `recovery-codes-reveal.widget.json` — one-shot reveal of the plaintext
  recovery codes with copy-all + download-as-txt CTAs. Client-side timer hides
  the codes after 60 seconds of no interaction to reduce shoulder-surfing risk.
  Renders `Cache-Control: no-store` on any embedding page.
- `webauthn-credential-card.widget.json` — one credential's card in the
  credentials-list view. Shows device_name + a device-type icon (platform vs
  hardware key vs synced passkey), last_used_at, action menu (rename / disable /
  delete).
- `mfa-challenge-prompt.widget.json` — the step-up modal prompt. Renders
  differently per method: TOTP input for typing, WebAuthn button that triggers
  `navigator.credentials.get()`, recovery-code input with helpful "if you've
  lost your device" copy.
