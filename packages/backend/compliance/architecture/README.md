# stackra/architecture

Architectural enforcement for Stackra apps. Prevents direct Model access
outside the Repository / Factory / Seeder / test contexts, plus 33 other rules
across data-first hygiene, Octane safety, filesystem convention, and
model/job/command shape. Ships a custom scanner CLI **and** a companion PHPStan
extension for scope-aware analysis.

## The layering contract

```
Controller  →  Service / Action  →  Repository  →  Model
```

Layers are resolved from (in priority order):

1. **Path convention** — files under configured `test_path_prefixes` or
   `infra_path_prefixes`.
2. **Class attribute** — `#[Domain]`, `#[Repository]`, `#[Service]`,
   `#[Action]`.
3. **Marker interface** —
   `Stackra\Architecture\Contracts\{Repository, Service, Action}`.
4. **Base-class inheritance** — `extends Model` → Model, `extends Controller` →
   Controller.
5. **Namespace convention** — configured in `config/architecture.php`.

## Marking classes

Attribute form (preferred on `final` classes):

```php
use Stackra\Architecture\Attributes\Repository;

#[Repository]
final class UserRepository { /* ... */ }
```

Interface form (when you also want `instanceof` / container tagging):

```php
use Stackra\Architecture\Contracts\Repository;

final class UserRepository implements Repository { /* ... */ }
```

## Escape hatch

```php
use Stackra\Architecture\Attributes\AllowsDirectModelAccess;

#[AllowsDirectModelAccess(reason: 'Legacy — remove after billing v2 lands.')]
final class BackfillInvoiceStatus extends Command { /* ... */ }
```

`reason` is required — no silent escape hatches.

## Running the check

```bash
composer architecture              # errors + warnings, exit 1 on error
composer architecture:strict       # every warning treated as error
```

Or directly:

```bash
php artisan stackra:architecture:check              # human-readable output
php artisan stackra:architecture:check --json       # newline-delimited JSON for CI
php artisan stackra:architecture:check --path=src   # scope to a subtree
```

Exit codes: **0** clean, **1** error-severity violation, **2** operator error.

## Rule catalogue

### Layering (2 rules)

| Rule id                                      | Severity         | What it does                                                                                                                               |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `architecture.no_direct_model_access`        | error            | Models may only be imported from Repositories, Factories, Seeders, other Models, tests, or classes with `#[AllowsDirectModelAccess]`.      |
| `architecture.no_repository_from_controller` | warning (opt-in) | Controllers must go through a Service/Action to reach Repositories. Off by default — set `ARCHITECTURE_STRICT_CONTROLLERS=true` to enable. |

### Tier 1 — data-first + framework hygiene (10 rules)

| Rule id                                       | Severity | What it does                                                                                                                |
| --------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `architecture.no_form_request`                | error    | Bans `use Illuminate\Foundation\Http\FormRequest;` and `extends FormRequest`. Use spatie/laravel-data DTOs.                 |
| `architecture.no_json_resource`               | error    | Bans `JsonResource` / `ResourceCollection` import and extension. Use spatie/laravel-data output DTOs.                       |
| `architecture.no_facades_in_services`         | error    | Bans facade imports in Service / Action layers. Inject via container attributes (`#[Auth]`, `#[Log]`, `#[Cache]`, `#[DB]`). |
| `architecture.controller_extends_base`        | error    | Controllers must extend `Stackra\Routing\BaseController`, not `Illuminate\Routing\Controller`.                           |
| `architecture.controller_needs_as_controller` | error    | Every Controller must carry `#[AsController]` — route discovery relies on it.                                               |
| `architecture.repository_needs_bind`          | error    | Every concrete Repository must carry `#[Bind(...RepositoryInterface::class)]`.                                              |
| `architecture.middleware_needs_as_middleware` | error    | Every Middleware must carry `#[AsMiddleware]`.                                                                              |
| `architecture.final_domain_classes`           | error    | Controllers, Services, Actions must be `final`.                                                                             |
| `architecture.require_strict_types`           | error    | Every non-config file must begin with `declare(strict_types=1);`.                                                           |
| `architecture.require_file_docblock`          | warning  | Every non-config file must have a header docblock with `@file` and `@description`.                                          |

### Tier 2 — content-scan for Octane safety (7 rules)

| Rule id                                          | Severity | What it does                                                                   |
| ------------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| `architecture.no_env_outside_config`             | error    | `env()` bypasses the config cache under Octane. Use `config()` or `#[Config]`. |
| `architecture.no_route_facade`                   | error    | `Route::get(...)` / etc. forbidden — every URL is on a controller.             |
| `architecture.no_static_state_in_services`       | error    | Writable static properties leak between Octane requests.                       |
| `architecture.no_request_validate_in_controller` | error    | `$request->validate([...])` forbidden — type-hint a Data DTO.                  |
| `architecture.no_app_make_in_constructor`        | error    | Service-locator in constructors freezes deps on `#[Singleton]` classes.        |
| `architecture.no_query_builder_in_services`      | error    | `Model::query()` / `DB::table()` forbidden in Services / Actions.              |
| `architecture.no_singleton_on_scoped_deps`       | error    | `#[Singleton]` classes cannot inject request-scoped deps.                      |

### Tier 3 — filesystem existence (7 rules)

| Rule id                                    | Severity | What it does                                                               |
| ------------------------------------------ | -------- | -------------------------------------------------------------------------- |
| `architecture.no_routes_folder`            | error    | `apps/*/routes/api.php` / `web.php` / `channels.php` must not exist.       |
| `architecture.no_resources_folder`         | error    | `apps/*/resources/` must not exist — every app is headless.                |
| `architecture.no_app_folder`               | error    | `apps/*/app/` must not exist — `src/` is the source root.                  |
| `architecture.no_route_service_provider`   | error    | No `RouteServiceProvider.php` file anywhere.                               |
| `architecture.migration_has_down`          | error    | Every migration must declare a `public function down()`.                   |
| `architecture.no_env_file`                 | error    | No `.env` file on disk — Doppler-only. `.env.example` allowed.             |
| `architecture.repository_interface_suffix` | warning  | Files under `Contracts/` matching `/Repository$/` must end in `Interface`. |

### Tier 4 — model / job / command shape (7 rules)

| Rule id                                         | Severity | What it does                                                                                          |
| ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `architecture.model_uses_fillable_attribute`    | warning  | Models must declare `#[Fillable]` / `#[Guarded]`, not the legacy `$fillable` / `$guarded` properties. |
| `architecture.model_no_side_effects`            | warning  | Models must not expose methods named `send`, `notify`, `process`, `charge`, etc.                      |
| `architecture.enum_is_backed_string`            | error    | Every enum must be `: string`-backed.                                                                 |
| `architecture.event_readonly_properties`        | warning  | Event properties must be `readonly`.                                                                  |
| `architecture.job_has_queue_attribute`          | warning  | `ShouldQueue` classes must declare `#[Queue]` + `#[Timeout]` + `#[Tries]`.                            |
| `architecture.job_implements_failed`            | warning  | `ShouldQueue` classes must declare `failed(\Throwable)`.                                              |
| `architecture.command_uses_attribute_signature` | warning  | Console commands must use `#[Signature]`, not the `$signature` property.                              |
| `architecture.no_http_namespace_nesting`        | warning  | Namespaces must be flat — `Stackra\<Package>\Controllers`, not `\Http\Controllers`.                |

### PHPStan extension — scope-aware rules (5 rules)

Auto-registered via `phpstan/extension-installer` — run via `composer analyse`.

| Rule id                                             | Severity | What it does                                                                                        |
| --------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `architecture.phpstan.no_facades_in_services`       | error    | Scope-aware facade detection — catches aliased imports the regex sibling misses.                    |
| `architecture.phpstan.no_query_builder_in_services` | error    | Resolves the class at the callsite via `ReflectionProvider` and walks parents for `Eloquent\Model`. |
| `architecture.phpstan.no_app_make_in_constructor`   | error    | Uses `Scope::getFunctionName() === '__construct'` for precise scope.                                |
| `architecture.phpstan.singleton_no_scoped_deps`     | error    | Walks `Class_::$attrGroups` + constructor param attributes.                                         |
| `architecture.phpstan.sensitive_parameter_required` | error    | Flags password / token / secret params without `#[SensitiveParameter]`.                             |

## Configuration

Publish the config:

```bash
php artisan vendor:publish --tag=architecture-config
```

Then edit `config/architecture.php`. Every rule reads its own subtree
(`architecture.rules.<rule_id>`) — see the shipped file for defaults.

## Extending

New source rule:

1. Create a class extending `Stackra\Architecture\Rules\AbstractRule`.
2. Implement `id()`, `description()`, `defaultSeverity()`,
   `check(SourceFile $file): array`.
3. Add to `ArchitectureServiceProvider::$sourceRules`.
4. Add a config subtree under `architecture.rules.<key>`.

New path rule:

1. Extend `AbstractPathRule` instead. Constructor takes only `array $config`.
2. Implement `check(string $root): array`.
3. Add to `ArchitectureServiceProvider::$pathRules`.

New PHPStan rule:

1. Implement `PHPStan\Rules\Rule` under `src/PhpStan/`.
2. Register it in `phpstan-extension.neon` under `services`.

## Tests

```bash
composer install
composer test        # runs Pest suite (61 tests, 141 assertions)
```

The bundled `tests/scan-template.php` script runs the whole rule set against
`apps/template` as a real-world verification — useful for smoke-testing rule
changes without spinning up Pest.

## Design notes

- **Regex parser, no `nikic/php-parser`.** ~200 lines of self-contained parsing.
  Handles namespace, class-head, extends, implements, class attributes, simple +
  grouped use statements, class-body + constructor-promoted properties, method
  declarations. Strips comments so docblock examples don't trip content-scan
  rules.
- **Stateless everything.** Parser + resolver + rules take inputs explicitly; no
  reflection at runtime, no facades, no `env()`. Safe under Octane.
- **Rule crashes are soft.** A rule that throws while inspecting a file becomes
  a `Warning` violation attributed to itself — the scan continues.
- **Two rule flavours.** `ArchitectureRule` inspects parsed source. `PathRule`
  inspects filesystem existence. Both run in one scanner pass.
