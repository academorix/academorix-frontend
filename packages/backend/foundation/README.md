# stackra/foundation

The shared kernel every Stackra package depends on. Nothing in here is
HTTP-specific; nothing in here is domain-specific. It's the small pile of
scaffolding that keeps every other package consistent.

## Public surface

| Namespace                                                       | Purpose                                                                                                                                                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Stackra\Foundation\Providers\AbstractModuleServiceProvider` | Base class every package's `<Name>ServiceProvider` extends. Turns declarative arrays (`$bindings`, `$policies`, `$middlewareAliases`, `$configs`, `$migrations`, `$routes`) into wiring calls. |
| `Stackra\Foundation\Providers\FoundationServiceProvider`     | Registers the correlation-id middleware alias, publishes the `foundation.php` config, binds the default `Clock`.                                                                               |
| `Stackra\Foundation\Contracts\HasErrorCode`                  | Interface for exceptions or DTOs that carry a stable, machine-readable error code.                                                                                                             |
| `Stackra\Foundation\Contracts\HasContext`                    | Interface for anything that carries a structured `array<string, mixed>` context payload.                                                                                                       |
| `Stackra\Foundation\Contracts\HasUserMessage`                | Interface for exceptions that carry a human-safe `userMessage` suitable for API responses.                                                                                                     |
| `Stackra\Foundation\Contracts\Correlatable`                  | Interface for anything that carries a correlation / trace id.                                                                                                                                  |
| `Stackra\Foundation\Contracts\Clock`                         | Testable "what time is it" abstraction.                                                                                                                                                        |
| `Stackra\Foundation\Support\Assert`                          | Guard-clause helpers (`Assert::notNull`, `Assert::notEmpty`, `Assert::inRange`) that throw domain exceptions from `stackra/exceptions` when they fire.                                      |
| `Stackra\Foundation\Support\CorrelationId`                   | Static accessor for the current-request correlation id.                                                                                                                                        |
| `Stackra\Foundation\Support\SystemClock`                     | Default `Clock` implementation.                                                                                                                                                                |
| `Stackra\Foundation\Middleware\AssignCorrelationId`          | Reads / mints the correlation id, stashes it on the request + response headers, exposes it via `CorrelationId::current()`.                                                                     |
| `Stackra\Foundation\Enums\AppEnvironment`                    | Enum wrapper around the string environments Laravel uses.                                                                                                                                      |

## Consuming this package

Every downstream package MUST declare `stackra/foundation` under `require`.
Every app MUST register the `FoundationServiceProvider` — package discovery does
this automatically via `extra.laravel.providers` in `composer.json`.

## Why the declarative base provider

Every domain package's `boot()` method used to be a long list of
`$this->loadMigrationsFrom(...)`, `Gate::policy(...)`,
`Router::aliasMiddleware(...)` calls. The `AbstractModuleServiceProvider` turns
those into typed arrays declared on the child class. Result: the "public
surface" of a package is visible at a glance, without reading imperative code.

```php
final class BillingServiceProvider extends AbstractModuleServiceProvider
{
    protected array $bindings = [
        \Stackra\Billing\Contracts\Invoicer::class => \Stackra\Billing\Services\StripeInvoicer::class,
    ];

    protected array $policies = [
        \Stackra\Billing\Models\Invoice::class => \Stackra\Billing\Policies\InvoicePolicy::class,
    ];

    protected array $middlewareAliases = [
        'billing.subscribed' => \Stackra\Billing\Http\Middleware\EnsureSubscribed::class,
    ];

    protected array $migrations = [__DIR__ . '/../../database/migrations'];

    protected array $configs = [
        __DIR__ . '/../../config/billing.php' => 'billing',
    ];

    protected array $routes = [
        ['file' => __DIR__ . '/../../routes/tenant.php', 'prefix' => 'billing', 'middleware' => ['auth:sanctum', 'billing.subscribed']],
    ];
}
```

## Testing

```bash
pnpm turbo run test --filter=@stackra/foundation
```

See parent [`docs/package-authoring.md`](../../docs/package-authoring.md).
