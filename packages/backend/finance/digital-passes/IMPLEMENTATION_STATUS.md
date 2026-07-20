# finance/digital-passes — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Digital passes = Apple Wallet (`.pkpass`) + Google Pay (`Wallet Objects API`)
membership cards. Every athlete with an active membership gets a pass they add
to their phone wallet.

### The pass lifecycle

```
membership.activated ─→ IssuePassJob ─→ Apple + Google pass generated ─→ signed URL
                                          │
                                          └─→ CustomerReceivesEmail with wallet links

membership.updated (renewal, plan change, expiry) ─→ push notification to phone
                                                     via APN + Google Wallet API
```

### Actions to fill (12 total)

- `ListDigitalPassAction` — GET /passes — customer sees their own passes.
- `ShowDigitalPassAction`
- `IssueDigitalPassAction` — POST /memberships/{membership}/passes — the action
  that IssuePassJob calls internally, or that an admin uses to re-issue a pass
  for a customer.
- `RevokeDigitalPassAction` — POST /passes/{pass}/revoke — invalidates the pass
  immediately via APN + Google Wallet API. Used on membership cancel / fraud.
- `RegenerateDigitalPassAction` — POST /passes/{pass}/regenerate — cuts a new
  pass with fresh signing (used when the tenant's Apple Pass Type ID cert
  rotates).
- `DownloadPassAction` — GET /passes/{pass}/download — returns the `.pkpass`
  binary. Signed short-lived URL.
- Webhook endpoints for Apple + Google device registrations (public, signed by
  device certs).

### Support services

- `ApplePassBuilder` (Services/) — builds a `.pkpass` bundle from a Membership
  row using the tenant's Apple Pass Type ID cert + team ID (stored encrypted in
  `settings.digital_passes.apple.*`).
- `GoogleWalletBuilder` (Services/) — builds a Google Wallet Object JWT using
  the tenant's Google service-account credentials.
- `PassSigner` (Services/) — X509 signing + zipping of the `.pkpass` manifest.
- `PassRegistrationHandler` (Services/) — handles Apple / Google device
  registration webhooks and stores `pass_registrations` rows.
- `PassPushNotifier` (Services/) — pushes pass updates to registered devices via
  APN + Google Wallet.

### Cert / secret handling

- Apple cert (PEM + password) → encrypted at rest in
  `tenant_digital_pass_configs`; loaded via `Crypt::decryptString` per request.
- Google service account JSON → same shape.
- Signing cert rotation is a deploy event — batch-regenerate all active passes
  via `RegenerateAllPassesJob`.

### Events

- `DigitalPassIssued`, `DigitalPassUpdated`, `DigitalPassRevoked`,
  `DigitalPassInstalledOnDevice`, `DigitalPassRemovedFromDevice`.

### Dependencies

- `simple-hacker/apple-passbook` or `spatie/passgenerator` for `.pkpass`.
- `google/apiclient` for Google Wallet.
- Both add composer surface + Doppler-managed cert secrets.
