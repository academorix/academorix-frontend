# Stackra Identity

Stackra Identity service — cross-Application identity plane. Owns the Application registry, Tenancy, Identity, User, MFA, ServiceAccount, Access (RBAC + invitations + grants + delegation + requests), Auth (login + JWT issuance + JWKS). SHARED across every Stackra product; one deployment per workspace.

## What lives here

- `bootstrap/app.php` — Laravel bootstrap. `withRouting()` wires only
  `commands:` + `health:` — HTTP routes are discovered from
  `#[AsController]` classes across every package (ADR-0016).
- `bootstrap/providers.php` — empty; every package auto-discovers
  its `ServiceProvider` via `extra.laravel.providers`.
- `config/*.php` — Laravel-level runtime config: `app`, `auth`, `cache`,
  `database`, `filesystems`, `logging`, `octane`, `queue`, `services`.
  Package-level config lives inside each package.
- `public/index.php` — Laravel HTTP entry.
- `storage/` — framework storage.
- `tests/` — Pest v4 (Feature + Unit split per `.kiro/steering/testing.md`).

## Boot flow

```
public/index.php → bootstrap/app.php
                → package provider registration
                → attribute discovery (routes, middleware, listeners)
                → HTTP dispatch OR queue worker
```

## Getting started

```bash
composer install
doppler run -- php artisan key:generate
doppler run -- php artisan migrate --seed
doppler run -- php artisan octane:start --workers=2
```

## Runbook

| Command                                   | Purpose                        |
| ----------------------------------------- | ------------------------------ |
| `composer test`                           | Run Pest (parallel)            |
| `composer test:coverage`                  | Coverage (min 80%)             |
| `doppler run -- php artisan migrate`      | Run migrations                 |
| `doppler run -- php artisan horizon`      | Start Horizon supervisor       |
| `doppler run -- php artisan octane:start` | Start Swoole worker pool       |

## Related

- `docs/services.md` — the six-service split; this is `stackra-identity`.
- `docs/adr/0032-six-service-split.md` — the topology decision.
- `docs/adr/0033-cross-service-authentication-contract.md` — JWT + `X-Service-Identity`.

## License

Proprietary. See `LICENSE` at the workspace root.
