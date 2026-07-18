# Coding conventions

## PHP

- `declare(strict_types=1);` at the top of every non-config PHP file.
- Explicit return types + parameter types on every method.
- Constructor property promotion for services and DTOs.
- Prefer `readonly` properties on value objects.
- File header docblock (`@file` + `@description`) on every file.
- PHPDoc `@return array{...}` array-shape annotations wherever arrays leak into
  the public API.
- Do not use `?:` on non-nullable operands — use `?? default` or explicit
  ternary.
- `match` over `switch` where the arms are pure value mappings.
- No trailing whitespace in HEREDOCs. Pint enforces this on save.

## Laravel

- Controllers are thin — invokable single-action classes are preferred over
  grouped resource controllers.
- Business logic lives in application services under
  `src/<Domain>/Application/*`. Never in models, never in controllers.
- Models expose no side-effecting methods (no `send()`, `notify()`, etc.).
  Actions belong on services.
- Prefer `spatie/laravel-data` DTOs over `array` for the controller-to-service
  handoff.
- Prefer `spatie/laravel-query-builder` filters over hand-rolled `whereHas`
  chains.
- Every migration ships an explicit `down()` that inverts the `up()`.

## Testing

- **Feature tests** cover controller-to-service happy paths.
- **Unit tests** cover services + domain logic (no framework boot).
- Use `RefreshDatabase` or `DatabaseTransactions` — never truncate.
- Factories over fixtures. Custom states for common variants.
- Assert on response shape via `assertJsonStructure()` + individual key values,
  not on full JSON string equality.

## Git

- Conventional Commits (see `commitlint.config.mjs`).
- Feature branches: `feat/<scope>-<short-desc>`. Never push to `main` directly.
- One logical change per commit. Split refactors from feature work.
- Every PR must reference an issue or a `docs/adr/` entry.
