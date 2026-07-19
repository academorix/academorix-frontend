# digital-passes

Apple / Google Wallet passes per blueprint §16.6. Wave 4.

## Owned entity

- `WalletPass` (`wpp_`) — provider-scoped pass with serial + QR payload.

## Cascade lifecycle

- `MEMBERSHIP_RENEWED` → `AutoUpdatePassOnMembershipRenewed` regenerates the
  pass content + pushes update via APNs/FCM.
- `MEMBERSHIP_CANCELLED` → `RevokePassOnMembershipCancelled` marks pass revoked;
  QR verification fails at gate.
- `Branding.updated` → `RegeneratePassesOnBrandingChange` re-renders all active
  passes with new logo/colors.

## QR verification at gate

Every pass carries a signed JWT in `qr_payload`. When scanned at a `credentials`
gate:

1. Verify JWT signature + expiry.
2. Resolve `tenant_id + holder_id + membership_id`.
3. Ingest into `sports/attendance` via ForwardCheckinToAttendance hook.

## ULID prefixes

- `wpp_`
