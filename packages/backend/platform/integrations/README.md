# stackra/integrations

Third-party integration credentials per Tenant. Owns the `TenantIntegration`
aggregate — Stripe, Slack, HubSpot, Zapier, custom OAuth2, SCIM, HRIS, LMS.

## Aggregate

| Aggregate           | ULID prefix | Purpose                                                                                                                                                                           |
| ------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TenantIntegration` | `wit_`      | One row per (Tenant × integration kind × provider). Config blob is encrypted at rest via KMS pointer; NEVER surfaces on the tenant-facing wire outside the redacted status shape. |

## Install

```bash
composer require stackra/integrations
```

## Blueprint

Wire contract at `modules/platform/blueprints/integrations/`.

## Contributes

- **Contracts (framework-swappable)**: `IntegrationSecretsCipherInterface` (KMS
  encrypt/decrypt of the `config` blob) + `IntegrationRegistryInterface`
  (per-provider `sync()` dispatcher). Default `Null*` implementations ship —
  consumer apps bind their own.
- **Permissions**: `IntegrationsPermission` — dual-guard (view + manage on
  `platform_admin`; manage-own on `sanctum`).
- **Commands**: `integrations:list`, `integrations:sync`,
  `integrations:rotate-tokens`, `integrations:purge-disabled`.
- **Events (7)**: `IntegrationConfigured`, `IntegrationSyncStarted`,
  `IntegrationSyncCompleted`, `IntegrationSyncFailed`,
  `IntegrationTokenRefreshed`, `IntegrationDisabled`, `IntegrationRemoved`.
- **Jobs (3)**: `SyncIntegrationJob`, `RefreshIntegrationTokenJob`,
  `PurgeDisabledIntegrationJob`.
- **Rule**: `valid_integration_provider` — checks that `provider` is a known key
  for the given `kind` (`config('integrations.providers')` whitelist).
- **Cast**: `IntegrationConfig` — encrypts on save, decrypts on hydrate via the
  container-resolved cipher.

## Encrypted-at-rest note

The `config` JSONB column NEVER holds plaintext. The `IntegrationConfig` cast
routes every read + write through `IntegrationSecretsCipherInterface`. The
default `NullIntegrationSecretsCipher` is a pass-through so the module boots
without a KMS backend — PRODUCTION MUST OVERRIDE with a KMS-backed cipher before
enabling real integrations.

## Tests

```bash
composer install
vendor/bin/pest
```
