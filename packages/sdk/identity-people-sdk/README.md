# academorix-identity/people-sdk

Wire-visible SDK surface for the `people` module of the Identity service.
Auto-discovered by `academorix/identity-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'people', service: 'identity')]`.

## Aggregates

- **person-guardian-links** — CENTRAL-plane guardian↔minor link that survives
  cross-tenant
- **person-identities** — CENTRAL-plane global identity carrying the Academorix
  ID
- **tenant-link-requests** — Consent-gated request from a tenant to link a local
  Athlete/Staff to a central PersonIdentity

## Layout

```
src/
├── PeopleSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Academorix\IdentitySdk\Client\IdentitySdk::class)
    ->people()
    ->personGuardianLinks()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/identity/people/`. Do not
hand-edit auto-generated files (they carry an `AUTO-GENERATED` header comment).
Files WITHOUT that header are hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py identity people
```
