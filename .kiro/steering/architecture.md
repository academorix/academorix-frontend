# Architecture

`stackra-backend` is a Composer path-repository monorepo orchestrated by
Turborepo. The layout:

```
apps/
  template/         — headless REST API template
  api/              — main tenant API (added in Phase 2 of migration)
  ai-service/       — standalone AI microservice
packages/           — shared PHP libraries (`stackra/*`)
docker/             — production Dockerfiles + local compose
docs/               — architecture, migration, doppler, package-authoring
scripts/            — bootstrap + migration helpers
```

## Non-negotiable conventions

- **`src/` as source root** across every app + package — override wired via
  `$app->useAppPath($app->basePath('src'))` in each app's `bootstrap/app.php`.
  Never introduce a Laravel-default `app/`.
- **Headless only** — no `resources/`, no `routes/web.php`, no session
  middleware, no CSRF cookie. All apps are token-only REST.
- **URL versioning** — `/api/v1/...`, cut a new file for v2 rather than
  deprecating in place.
- **Sanctum personal-access tokens** — never sessions.
- **Doppler for secrets** — no `.env` on disk anywhere. Every composer script
  wraps in `doppler run --`.
- **Full docblocks + inline comments** on every new file the agent writes —
  carried across sessions as a standing instruction.

## Standard tools

| Concern            | Tool                             |
| ------------------ | -------------------------------- |
| Formatting         | Laravel Pint                     |
| Static analysis    | Larastan / PHPStan (level max)   |
| Refactoring        | Rector                           |
| Testing            | Pest v4                          |
| Mutation testing   | Infection                        |
| API docs           | Scramble                         |
| Queue supervisor   | Horizon                          |
| Error tracking     | Sentry                           |
| Secrets            | Doppler                          |
| Task orchestration | Turborepo                        |
| Git hooks          | Husky + commitlint + lint-staged |
