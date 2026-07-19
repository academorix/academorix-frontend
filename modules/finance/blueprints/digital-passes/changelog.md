# digital-passes — changelog

## [Unreleased] — inception (Wave 4)

- One entity: WalletPass.
- Apple Wallet (`.pkpass`) + Google Wallet + generic QR.
- Auto-update push on membership renewal; auto-revoke on cancellation.
- Signed-JWT QR payload verified at gate.
- 5 events including `PassIssued`, `PassInstalled`, `PassRevoked`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `athlete`, `membership`,
  `credentials`, `attendance`, `storage`, `notifications`.

### ULID prefixes

- `wpp_` — registered.
