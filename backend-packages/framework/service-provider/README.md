# `academorix/service-provider`

Attribute-driven module service provider for Laravel — declarative
resource loading, olvlvl-cached discovery, lifecycle hooks. The
enterprise-grade replacement for hand-rolled `boot()` / `register()`
methods.

Ported from the enterprise `academorix/laravel-service-provider` package
with monorepo-friendly adaptations. See `MIGRATION.md` for what changed
and where the remaining integration points (`academorix/routing`,
`academorix/compiler`) plug in.

## Quick start

```php
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Providers\ServiceProvider;

#[AsModule(name: 'Blog')]
final class BlogServiceProvider extends ServiceProvider
{
    // That's it — migrations, config, translations, routes, commands,
    // and publishables are auto-loaded from the conventional layout.
}
```

See `.examples/` for nine ready-made recipes covering API-only, deferred,
full-featured, third-party base, custom boot logic, background jobs,
vendor overrides, and lifecycle-event integration patterns.
