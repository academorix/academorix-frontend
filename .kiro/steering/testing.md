# Testing

## Framework

Pest v4. All tests live under `apps/<name>/tests/` (or `packages/<name>/tests/`
for library packages).

## Layout

```
tests/
  Feature/       — HTTP + queue + full-stack scenarios
  Unit/          — services, DTOs, pure functions
  Pest.php       — global test config
  TestCase.php   — base test case
```

## Creating tests

Use the Artisan generator so the file lands in the right place with correct
namespacing:

```bash
doppler run -- php artisan make:test SomeFeatureTest --pest
doppler run -- php artisan make:test SomeUnitTest --pest --unit
```

Do NOT include the suite folder in the name — the flag decides.

## Running tests

```bash
composer test                              # everything, parallel
composer test:coverage                     # with coverage, min 80%
doppler run -- php artisan test --filter=SomeTest
```

## Rules

- Every controller endpoint gets at least one happy-path test.
- Every service method gets at least one unit test.
- Feature tests use `RefreshDatabase`; never truncate.
- Prefer factories with named states over fixture arrays.
- Assert on `assertJsonStructure` + specific values — not on full JSON equality
  (fragile).
- Do NOT delete tests without user approval — see AGENTS.md.
