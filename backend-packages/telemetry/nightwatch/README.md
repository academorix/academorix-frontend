# Academorix Nightwatch

Laravel Nightwatch production monitoring integration with attribute-driven
context discovery, sampling, filtering, and redaction for Academorix applications.

## Features

- **Attribute-Driven Context** — `#[AsNightwatchContext]` auto-registers context
  providers
- **Attribute-Driven Filters** — `#[AsNightwatchFilter]` auto-registers event
  filters
- **Attribute-Driven Redactors** — `#[AsNightwatchRedactor]` auto-registers data
  redactors
- **Attribute-Driven Samplers** — `#[AsNightwatchSampler]` auto-registers
  dynamic samplers
- **Pure Data Providers** — Context providers return key + data, the compiler
  wraps with `Context::add()`
- **Facade** — `Nightwatch` facade wrapping the context registry

## Quick Start

### Context Provider

Providers return data — the service provider wraps with `Context::add()`:

```php
#[AsNightwatchContext]
class TenantContext implements NightwatchContext
{
    public function key(): string { return 'tenant'; }

    public function data(): array
    {
        return ['id' => tenant()->id, 'name' => tenant()->name];
    }

    public function priority(): int { return 100; }
}
```

### Filter

```php
#[AsNightwatchFilter(NightwatchEventType::Query)]
class CacheQueryFilter implements NightwatchFilter
{
    public function reject(mixed $record): bool
    {
        return str_contains($record->sql, 'from `cache`');
    }
}
```

### Redactor

```php
#[AsNightwatchRedactor(NightwatchEventType::Request)]
class IpRedactor implements NightwatchRedactor
{
    public function redact(mixed $record): void
    {
        $record->ip = preg_replace('/\d+$/', '***', $record->ip);
    }
}
```

### Dynamic Sampler

```php
#[AsNightwatchSampler]
class AdminSampler implements NightwatchSampler
{
    public function shouldSample(Request $request): bool|null
    {
        return $request->user()?->isAdmin() ? true : null;
    }

    public function priority(): int { return 100; }
}
```
