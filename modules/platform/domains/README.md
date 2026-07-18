# academorix/domains

Custom-domain substrate for tenant white-label. Owns the `Domain` aggregate
(canonical hostname bound to a Tenant) and `DomainRecord` (the expected DNS
records diffed by the verification job).

## Aggregates

| Aggregate      | ULID prefix | Purpose                                                                                     |
| -------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `Domain`       | `dom_`      | Custom hostname per Tenant. `subdomain` (auto) / `custom` / `alias` — one primary per tenant. |
| `DomainRecord` | `drc_`      | Expected DNS record we diff against real DNS. Not authoritative; a checklist for verification. |

## Install

```bash
composer require academorix/domains
```

Auto-registers via `extra.laravel.providers`.

## Blueprint

The wire contract lives at `modules/platform/blueprints/domains/`.

## Contributes

- **Contracts (framework-swappable)**: `DomainVerifierInterface`,
  `CertificateProvisionerInterface`. Default `Null*` implementations are
  no-ops; consumer apps bind concrete DNS + ACME providers.
- **Permissions**: `DomainsPermission` (view + manage — dual-guard).
- **Commands**: `domains:verify`, `domains:reverify`,
  `domains:issue-certificate`, `domains:rotate-certificates`.
- **Events (10)**: Domain lifecycle (added / verified / verification-failed /
  removed) · DomainRecord lifecycle (created / updated / removed) · Certificate
  lifecycle (issued / rotated / expiring).
- **Rules**: `valid_domain_host` (RFC 1035 hostname check).

## DNS + ACME are pluggable

`NullDomainVerifier` and `NullCertificateProvisioner` ship as safe no-ops. A
consumer app binds a real implementation (e.g. `AwsRoute53Verifier`,
`LetsEncryptProvisioner`) via `#[Bind]` on the concrete class or a
container override. The job bodies handle the round-trip; only the
verify + issue calls delegate to the pluggable provider.

## Tests

```bash
composer install
vendor/bin/pest
```
