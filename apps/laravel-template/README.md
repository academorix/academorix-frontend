# Stackra API

Headless REST API for the Stackra platform. Bootstraps the ~90 backend packages
under `packages/backend/**` into a runnable Laravel Octane service.

## What lives here

- `bootstrap/app.php` — Laravel bootstrap. `withRouting()` wires only
  `commands:` + `health:` — HTTP routes are discovered from `#[AsController]`
  classes across every package (per ADR-0016).
- `bootstrap/providers.php` — every backend package's `ServiceProvider`.
- `config/*.php` — Laravel-level runtime config: `app`, `auth`, `cache`,
  `database`, `filesystems`, `logging`, `queue`, `services`. Package-level
  config lives inside each package.
- `public/index.php` — Laravel HTTP entry.
- `storage/` — framework storage.
- `tests/` — Pest v4 test suite (Feature + Unit split per
  `.kiro/steering/testing.md`).

## What does NOT live here

Per `.kiro/steering/architecture.md` §Headless only:

- No `resources/views/*.blade.php` — API is JSON. (Exception: the exceptions
  package ships browser-fallback error pages at
  `packages/backend/framework/exceptions/src/views/`.)
- No `routes/web.php` — no web routes.
- No CSRF cookie / session state.
- No frontend build (`node_modules/`, `vite.config.js`, `package.json`).

## Boot flow

```
public/index.php → bootstrap/app.php → package provider registration
                                     → attribute discovery (routes, middleware, listeners, etc.)
                                     → HTTP dispatch OR queue worker
```

## Getting started

```bash
composer install
doppler run -- php artisan key:generate
doppler run -- php artisan migrate --seed
doppler run -- php artisan octane:start --workers=2 --max-requests=1000
```

For dev without Octane:

```bash
doppler run -- php artisan serve
```

## Runbook

| Command                                   | Purpose                        |
| ----------------------------------------- | ------------------------------ |
| `composer test`                           | Run Pest suite (parallel)      |
| `composer test:coverage`                  | Run with coverage, min 80%     |
| `doppler run -- php artisan migrate`      | Run every package's migrations |
| `doppler run -- php artisan horizon`      | Start Horizon supervisor       |
| `doppler run -- php artisan octane:start` | Start Swoole worker pool       |

## References

- `docs/architecture.md` — the actual workspace tree
- `docs/adr/0016-actions-only-no-services-no-controllers.md` — every endpoint is
  one Action
- `docs/adr/0021-*.md` — headless mandate
- `docs/adr/0022-language-agnostic-service-boundary.md` — the four seams
- `docs/adr/0028-runtime-target-laravel-octane.md` — Octane invariants
- `docs/adr/0034-octane-driver-swoole.md` — Swoole driver choice
- `.kiro/steering/**/*.md` — per-concern authoring rules

## License

Proprietary. See `LICENSE` at the workspace root.
