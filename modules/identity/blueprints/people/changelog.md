# people — changelog

## [Unreleased] — inception (Wave 1)

- People module authored. CENTRAL-plane (no tenant_id). Three owned entities:
  - `PersonIdentity` (`pin_`) — global identity carrying the Academorix ID.
  - `PersonGuardianLink` (`pgl_`) — cross-tenant guardian↔minor link.
  - `TenantLinkRequest` (`tlr_`) — consent-gated request to bind a tenant
    Athlete/Staff to a PersonIdentity.
- Academorix ID format: `AX-XXXX-YYYY` (4+4 Crockford base32) — human-shareable.
- Enumeration-resistant lookup — `POST /people/lookup` returns
  `{ found: bool, request_url? }` with NO PII pre-consent.
- Rate limits: 10 lookups/hour/IP, 100 lookups/day/tenant, 3-of-5 sliding-window
  failed match lockout for 24h.
- Consent flow with per-field shareable subset — guardian chooses what to share;
  medical/financial/scoring never included.
- 9 published events: `PersonRegistered`, `PersonVerified`, `PersonUpdated`,
  `LinkRequested`, `LinkApproved`, `LinkDeclined`, `LinkRevoked`,
  `GuardianLinkAdded`, `GuardianLinkRemoved`.
- Cascades: link revocation stops future sync but preserves local tenant data
  (per GDPR); person freeze locks all active links read-only.
- Retention: PersonIdentity indefinite (identity of record); TenantLinkRequest 3
  years post-decision; expired requests auto-declined 30d after creation.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`.
- Extended by NONE. Planned consumers: athlete, athlete-guardian, staff,
  identity, user (tenant rows adopt nullable `person_identity_id` FK).

### Design notes

- CENTRAL-plane: `PersonIdentity` / `PersonGuardianLink` / `TenantLinkRequest`
  tables live on the central connection, NOT in tenant DBs. Only cross-DB FK in
  the platform is `tenant_row.person_identity_id → central.person_identity.id`.
- Cross-DB writes are ONE-WAY: tenants link to a central identity; central never
  writes into a tenant DB.
- The reference domain and hierarchy.md §1a rejects a "universal Person" that
  unifies Athlete/Staff/User — this module is deliberately narrow: it owns
  IDENTITY only, not academy roles.

### ULID prefix registration

- `pin_`, `pgl_`, `tlr_` — registered in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
