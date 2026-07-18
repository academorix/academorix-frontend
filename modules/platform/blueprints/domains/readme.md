# domains

**Custom domain substrate for tenant white-label.** Owns `Domain` (a canonical
hostname bound to a Tenant) and `DomainRecord` (individual DNS records — CNAME,
A, TXT, MX — inside a Domain). Publishes DNS verification round-trips,
certificate rotation jobs, and the `DomainVerifier` binding every host-resolver
consumes.

Extracted from `tenants` at v0.3 because DNS verification and certificate
lifecycles are fundamentally different from a Tenant's own lifecycle — they can
run for hours (waiting on DNS propagation), rotate on their own schedule (Let's
Encrypt renewal 30d before expiry), and fail in ways a Tenant itself never does.
Keeping them together with Tenant was producing a mega-module that changed for
two different reasons.

## Entities

| Entity         | ULID   | Description                                                                                      |
| -------------- | ------ | ------------------------------------------------------------------------------------------------ |
| `Domain`       | `dmn_` | Canonical hostname owned by a Tenant. State machine: `pending → verifying → verified → expired`. |
| `DomainRecord` | `dnr_` | DNS record (CNAME, A, TXT, MX) inside a Domain. Diff-state, not lifecycle-tracked.               |

## Contributions

- **Bindings:** `DomainVerifier` (DNS TXT / HTTP challenge),
  `CertificateProvisioner` (Let's Encrypt or vendor).
- **Jobs:** `VerifyDomainDnsJob`, `IssueCertificateJob`, `RotateCertificateJob`,
  `PurgeExpiredCertificatesJob`.
- **Events:** `DomainAdded`, `DomainVerified`, `DomainVerificationFailed`,
  `DomainRemoved`, `CertificateIssued`, `CertificateRotated`,
  `CertificateExpiring`.

## Boot order

Priority **12** — boots after `tenants` (10) since every Domain belongs to a
Tenant.

## Cross-cutting invariants

- **Every Domain carries `tenant_id`** via `BelongsToTenant`.
- **DomainRecord is NOT soft-deleted** — records are diff-state rows; removing a
  record means the record row is hard-deleted after the DNS provider confirms.
- **DomainVerifier is idempotent** — running verification on an already-
  verified domain is a no-op returning the existing verified state.

## Related

- `../README.md` — platform tier index.
- `.kiro/steering/hierarchy.md` §6 — module responsibility map.
