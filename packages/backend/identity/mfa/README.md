# stackra/mfa

Server-side Laravel package for the `mfa` module. Auto-generated from the
blueprint at `modules/identity/blueprints/mfa/`.

## Entities

- **MfaChallenge** (`mfc_...`) — One in-flight MFA challenge — the row in the
  shared auth_mfa_challenges ledger (owned by identity/auth).
- **RecoveryCodesDownload** (`...`) — DTO returned by POST
  /api/v1/me/mfa/recovery-codes/regenerate (fresh set) OR POST
  /api/v1/me/mfa/recovery-codes/download...
- **TotpEnrollmentPreview** (`...`) — DTO returned by POST
  /api/v1/me/mfa/totp/enroll/preview (round 1 of the two-round TOTP enrolment).
- **WebauthnCredential** (`wac_...`) — One WebAuthn (FIDO2) credential
  registered against an Identity.

## Layout

```
src/
├── Providers/                     # <Name>ServiceProvider (module boot)
├── Contracts/
│   ├── Data/*Interface.php        # TABLE + ATTR_* constants (#[Bind]-bound to Model)
│   └── Repositories/*Interface.php
├── Models/*.php                   # Eloquent, attribute-first
├── Repositories/*.php             # #[AsRepository] + #[UseModel]
├── Data/*.php                     # Spatie Data output DTOs
├── Policies/*.php                 # Wired via #[UsePolicy] on the Model
├── Events/*.php                   # Domain events (ShouldDispatchAfterCommit)
└── Actions/*.php                  # Single-invoke controllers (#[AsController])
database/
├── migrations/*.php
├── factories/*.php
└── seeders/*.php                  # (dual-source catalogues only)
tests/
├── Feature/
└── Unit/
```

## Regeneration

```bash
python3 modules/shared/blueprints/foundation/scripts/generate-module.py \
    identity mfa --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`stackra-identity/mfa-sdk` under `sdk/identity-mfa-sdk/`. Consumers cross the
service boundary through the SDK; this package is the SERVER-side owner of the
domain.
