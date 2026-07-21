# platform/domains — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; DNS verification + certificate flow pending

## What landed

- `Domain` model + `DomainInterface` — the custom domain record. Carries
  `tenant_id`, `hostname`, `is_primary`, `verified_at`, `verification_token`,
  `certificate_state` (`pending` / `issuing` / `active` / `expired` /
  `revoked`), `certificate_expires_at`. The stancl tenancy package's Domain
  model is the base; this extends it with certificate state.

## What's pending

### Actions to complete

- `AddDomain` (POST `/api/v1/tenant/domains`) — associate a hostname with the
  tenant. Generates a `verification_token` + returns the DNS TXT record the
  tenant must publish.
- `VerifyDomain` (POST `/{domain}/verify`) — reads the DNS TXT for the domain +
  checks against `verification_token`. On match: sets `verified_at`, fires
  `DomainVerified`.
- `IssueCertificate` (POST `/{domain}/certificate`) — kicks off Let's Encrypt
  HTTP-01 or DNS-01 challenge via `AcmePhp\Acme` client. Blocked if the domain
  is not verified. Fires `DomainCertificateIssuing`, then
  `DomainCertificateIssued` on success.
- `RevokeCertificate` — administrative revoke.
- `SetPrimaryDomain` (POST `/{domain}/set-primary`) — one domain per tenant is
  primary — used as the canonical `X-Tenant-Id` resolution target.
- `RemoveDomain` — soft-delete. Refuses primary domain removal when it's the
  tenant's only verified domain.
- `ListDomains`, `ShowDomain` — CRUD read.

### Services

- `DnsVerifier` — issues the DNS TXT lookup + compares against the expected
  token. Uses `dns_get_record` with `DNS_TXT`.
- `AcmeCertificateProvisioner` — wraps `AcmePhp\Ssl` for the Let's Encrypt
  HTTP-01 challenge. Stores the certificate + private key encrypted in the DB
  (Laravel Encrypter cast).
- `CertificateRenewer` — nightly scheduled task. Reads every `Domain` with
  `certificate_expires_at < now()->addDays(30)` + re-provisions. Fires
  `DomainCertificateRenewed`.
- `EdgeCertificatePublisher` — pushes the certificate to the CDN edge
  (Cloudflare / Fastly / CloudFront) so terminated TLS works at the load
  balancer.

### Domain events

- `DomainAdded` / `DomainVerified` / `DomainRemoved` / `DomainCertificateIssued`
  / `DomainCertificateRenewed` / `DomainCertificateExpired` /
  `DomainCertificateRevoked` / `DomainSetPrimary`.

### Cross-module dependencies

- **`platform/tenancy`** — every tenant provisions a default subdomain
  (`{slug}.stackra.app`) with a wildcard certificate. Custom domains extend
  the mapping.
- Frontend — reads the tenant's primary domain from the bootstrap payload to
  inject the correct absolute URLs.

## Backlog priorities

1. **P0 — Add + verify flow.**
2. **P1 — Let's Encrypt integration.** Blocked on ops decision: central-plane
   cert provisioning vs per-edge-node.
3. **P1 — Certificate renewer scheduled task.**
4. **P2 — Certificate revoke + edge publisher.**
