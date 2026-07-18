# integrations

**Third-party integration credentials per Tenant** — Stripe, Slack, HubSpot,
Zapier, custom OAuth2, SCIM providers. Owns `TenantIntegration` (one row per
(tenant, provider)).

Extracted from `tenants` at v0.3 because integration credentials carry
**different sensitivity** than a Tenant's own configuration:

- Encrypted at rest with a Doppler-derived KMS key (not the app-level cipher).
- Rotate on their own schedule (OAuth refresh, SCIM secret rotation).
- **NEVER** surface on the tenant-facing wire outside a redacted status shape
  (`{provider, status, last_synced_at}`) — the raw config JSON is
  platform-admin-only.

Keeping them in the tenants core would put secrets next to tenant config in the
same wire model, one careless `?include=integrations` away from a credential
leak.

## Entities

| Entity              | ULID   | Description                                                                                                                  |
| ------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `TenantIntegration` | `win_` | Configured integration for a Tenant. Carries encrypted credentials, provider identity, sync state, last-refreshed timestamp. |

## Contributions

- **Casts:** `IntegrationConfig` (encryption-aware JSONB cast).
- **Bindings:** `IntegrationRegistry` (available providers + capability matrix),
  `IntegrationSecretsCipher` (KMS-backed envelope encryption).
- **Jobs:** `SyncIntegrationJob`, `RefreshIntegrationTokenJob`,
  `PurgeDisabledIntegrationJob`.
- **Events:** `IntegrationConfigured`, `IntegrationSyncStarted`,
  `IntegrationSyncCompleted`, `IntegrationSyncFailed`,
  `IntegrationTokenRefreshed`, `IntegrationDisabled`, `IntegrationRemoved`.

## Boot order

Priority **12** — boots after `tenants` (10).

## Cross-cutting invariants

- **Every TenantIntegration row carries `tenant_id`** via `BelongsToTenant`.
- **The `config` column is encrypted at rest.** Reading it always goes through
  `IntegrationSecretsCipher::decrypt(...)`; direct DB reads produce ciphertext,
  not JSON.
- **Wire redaction is enforced by the Data class**, not by hoping the caller
  filters — the output DTO never exposes the raw `config`. There is no
  `?include=secrets` flag.
- **Observer refuses cross-tenant writes** — a Slack integration on Tenant A
  cannot be moved to Tenant B; you delete + recreate.

## Related

- `../README.md` — platform tier index.
- `.kiro/steering/tenancy-columns.md` §5 — forbidden columns + secret handling.
