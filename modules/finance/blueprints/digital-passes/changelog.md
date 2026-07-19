# digital-passes — changelog

## [Unreleased] — inception (Wave 4)

- One entity: WalletPass.
- Wraps `spatie/laravel-mobile-pass` v1 (Apple `.pkpass` generation + Google
  Wallet Passes API + APNs/FCM push-update pipeline).
- Provider dimension: apple / google / generic_qr.
- Kind dimension: membership_card / event_ticket / day_pass_card.
- Status lifecycle: issued → installed → updated → revoked / expired.
- Auto-update push on membership renewal via `PushWalletUpdateJob`.
- Auto-revoke on membership cancellation.
- Auto-regenerate all active passes on `Branding.updated` (via
  `RegeneratePassesOnBrandingChangeJob`).
- QR payload is a signed JWT bound to
  `tenant_id + holder_id + membership_id + expires_at`. Verified by
  `credentials` module at gate scan.
- 7 published events: `PassIssued`, `PassInstalled`, `PassUpdated`,
  `PassRemovedByUser`, `PassRevoked`, `PassExpired`, `PassScanned`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `athlete`, `membership`,
  `credentials`, `attendance`, `storage`, `notifications`, `branding`,
  `integrations`.

### Vendor packages

- `spatie/laravel-mobile-pass` ^1.0
  ([docs](https://spatie.be/docs/laravel-mobile-pass/v1/introduction))

### Retention

- 7 years post-revoke (financial audit horizon for membership passes).

### ULID prefixes

- `wpp_` — registered.
