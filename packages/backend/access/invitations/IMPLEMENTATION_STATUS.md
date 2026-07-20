# access/invitations — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Token-based invitations with polymorphic target (Tenant, Team, Athlete,
Federation, ...). Email carries the plaintext token; DB stores bcrypt hash.
Default expiry 7 days.

### Actions to fill

| Action                    | Contract                                                | Notes                                                                                                                       |
| ------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `SendInvitationAction`    | `POST /api/v1/invitations`                              | Body: `{ email, target_type, target_id, role?, message? }`. Generate a fresh 32-byte token, bcrypt-hash for storage, plaintext in the queued mail. Fires `InvitationCreated`. |
| `AcceptInvitationAction`  | `POST /api/v1/invitations/accept`                       | Body: `{ token }`. Look up by hashing the token; constant-time compare. Refuse on expired/consumed. Provisions the target relationship (User → Tenant, User → Team, etc.). Fires `InvitationAccepted`. |
| `DeclineInvitationAction` | `POST /api/v1/invitations/decline`                      | Same lookup path. Marks as declined; no target-relationship provisioned.                                                    |
| `ResendInvitationAction`  | `POST /api/v1/invitations/{invitation}/resend`          | Regenerate the token (invalidating the old one) + queue a fresh email. Rate-limited.                                        |
| `RevokeInvitationAction`  | `DELETE /api/v1/invitations/{invitation}`               | Mark as revoked. Idempotent.                                                                                                |
| `ListInvitationsAction`   | `GET /api/v1/invitations`                               | Tenant scope + `#[RequirePermission(InvitationsPermission::View)]`. Filter by status / target_type.                         |
| `ShowInvitationAction`    | `GET /api/v1/invitations/{invitation}`                  | Row + polymorphic target (eager-loaded).                                                                                    |

### Services to implement

- `InvitationTokenIssuer` — 32-byte CSPRNG token; bcrypt cost 12; expiry from
  config (default 7 days).
- `InvitationTargetRegistry` — attribute-discovered map of `target_type` →
  concrete resolver (`TenantInvitationTarget`, `TeamInvitationTarget`, ...).
  Already partially scaffolded under `Registry/`.
- `InvitationAcceptor` — atomic acceptance: mark invitation row as consumed +
  provision the target relationship + fire event, all in a single
  `DB::transaction`.
- `InvitationExpiryScanner` — daily cron: mark past-expiry rows as expired,
  fires `InvitationExpired`.

### Events to fire

- `InvitationCreated`, `InvitationAccepted`, `InvitationDeclined`,
  `InvitationExpired`, `InvitationRevoked`.

### Cross-module dependencies

- `notifications` — email dispatch with the plaintext token.
- `identity/user` — target provisioning via `UserProvisioner`.
- `access/rbac` — role attachment on acceptance.
- Every tenant-scoped module that wants to be an invitation target — provides
  an `#[Invitable]`-decorated resolver.
