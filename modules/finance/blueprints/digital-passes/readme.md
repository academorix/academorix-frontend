# digital-passes

Apple Wallet + Google Wallet digital membership passes per blueprint §16.6.
Wave 4.

**Underlying vendor package: `spatie/laravel-mobile-pass` v1**
(https://spatie.be/docs/laravel-mobile-pass/v1/introduction).

## What this module owns

- `WalletPass` (`wpp_`) — provider-scoped pass with serial + signed-JWT QR
  payload.

## What the vendor package handles

- Apple `.pkpass` bundle generation + signing.
- Google Wallet Passes API integration.
- Apple Push Notification service (APNs) + Firebase Cloud Messaging (FCM) update
  push.
- Device registration + unregistration endpoints (Apple's contract for pass
  updates).
- The five Apple Wallet HTTP endpoints Apple's server expects
  (`GET /wallet/passes/{serial}.pkpass`, device registration/unregistration,
  log).

## What this module adds on top of the vendor

- **Tenant scoping** — every pass belongs to a tenant + a holder
  (athlete/staff/user).
- **Branding-driven regeneration** — when `platform/branding` updates the tenant
  logo/colors, `RegeneratePassesOnBrandingChangeJob` re-mints every active pass.
- **QR payload signed JWT** — `QrPayloadMinter` produces a signed token bound to
  `tenant_id + holder_id + membership_id + expires_at`. Verified at gate scan by
  the `credentials` module before attendance ingest.
- **Membership lifecycle cascades**:
  - `MEMBERSHIP_RENEWED` → `AutoUpdatePassOnMembershipRenewed` re-mints + pushes
    via APNs/FCM.
  - `MEMBERSHIP_CANCELLED` → `RevokePassOnMembershipCancelled` marks pass
    revoked; gate scan fails.
  - `MEMBERSHIP_EXPIRED` → auto-marks pass expired; app strips the pass from
    wallet.
- **Retention** — 7 years post-revoke for audit; deleted-tenant cascade
  preserves the audit shell.

## QR verification at gate

Every pass carries a signed JWT in `qr_payload`. When scanned at a `credentials`
gate:

1. Verify JWT signature + expiry (issued from tenant's local key).
2. Resolve `tenant_id + holder_id + membership_id`.
3. Ingest into `sports/attendance` via `ForwardCheckinToAttendance` hook.
4. On success: fire `PassScanned` event; on failure: fire `PassScanFailed`.

Pairs with a PIN or authenticated NTAG when the credential is used for higher-
assurance flows (per `credentials/readme.md` security note — bare NFC UIDs are
clonable and never used alone for anything beyond attendance convenience).

## Tenant-config surface

Per-tenant credentials (Apple .pkpass certificate + Google Wallet issuer key)
live in `platform/integrations` under `wallet_apple` + `wallet_google` provider
kinds. Never in this module's config file — this module reads them from the
integration registry at issuance time.

## ULID prefixes

- `wpp_`
