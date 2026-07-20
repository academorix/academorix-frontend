# academorix/health

Attribute-driven health check discovery + notification channel
routing for every Academorix app. Bridges
[`spatie/laravel-health`](https://spatie.be/docs/laravel-health) with
a zero-boilerplate `#[AsHealthCheck]` attribute discovered at
`composer dump-autoload` time via
[`olvlvl/composer-attribute-collector`](https://github.com/olvlvl/composer-attribute-collector).

## What you get

- **`#[AsHealthCheck]` attribute.** Slap it on a Spatie `Check`
  subclass and it registers itself. No `bootstrap/providers.php`
  edits, no `HealthProvider::checks()` list to maintain, no manual
  registration path.
- **DI-friendly construction.** Checks are resolved through
  Laravel's container, not Spatie's static `::new()`. Constructor
  dependencies (Connection, Cache, domain services) hydrate
  automatically.
- **`HealthNotificationChannel` enum.** Packages route to logical
  channels (`SlackPlatformEng`, `PagerDuty`, `Email`) — apps map
  channels to concrete Slack webhooks / PagerDuty keys via config.
  Packages never carry secrets.
- **Zero runtime discovery cost.** Attribute scanning happens once
  at `composer dump-autoload`. Boot-time cost is just `include
  vendor/attributes.php` + `array_filter`.

## Why no manual `AbstractModuleHealthProvider`

The old backend supported both attribute discovery AND a
programmatic contributor contract. That's dropped — one path, one
convention. Every case the old abstract covered is now handled by
the attribute path:

- **Checks needing DI** — resolved through the container instead
  of `::new()`, so constructor injection just works.
- **Environment-conditional checks** — `condition:` field points
  at a `public static bool`-returning method on the check class.
- **Data-driven checks (N checks per config entry)** — declare N
  check classes, each with its own attribute. If truly dynamic,
  wrap them in a factory class that ships a static `condition`
  method and iterates internally at run time.

## Quick start

### 1. Install

The AI service already depends on this package. For a fresh app:

```bash
composer require academorix/health
```

The service provider is auto-discovered — nothing to add to
`bootstrap/providers.php`.

### 2. Publish the config (once per app)

```bash
php artisan vendor:publish --tag=health-config
```

Then map each logical channel to a concrete notifiable via env vars
in the newly-published `config/health.php`:

```env
HEALTH_SLACK_PLATFORM_ENG_WEBHOOK=https://hooks.slack.com/services/...
HEALTH_PAGERDUTY_INTEGRATION_KEY=R0000...
HEALTH_EMAIL_TO=ops@academorix.test
```

### 3. Write a check

```php
namespace Academorix\AI\Health;

use Academorix\Health\Attributes\AsHealthCheck;
use Academorix\Health\Enums\HealthNotificationChannel;
use Illuminate\Support\Facades\DB;
use Spatie\Health\Checks\Check;
use Spatie\Health\Checks\Result;

#[AsHealthCheck(
    name:     'ai.pgvector',
    label:    'pgvector extension',
    schedule: '5 * * * *',                                    // every 5 min
    channel:  HealthNotificationChannel::SlackPlatformEng,
)]
final class PgVectorHealthCheck extends Check
{
    public function run(): Result
    {
        $result = Result::make();

        try {
            $installed = DB::selectOne(
                "SELECT 1 FROM pg_extension WHERE extname = 'vector' LIMIT 1",
            );

            return $installed
                ? $result->ok('pgvector installed')
                : $result->failed('pgvector extension missing');
        } catch (\Throwable $exception) {
            return $result->failed('pgvector probe failed: ' . $exception->getMessage());
        }
    }
}
```

That's it. Run `composer dump-autoload` once (or let Laravel do it
via a normal `composer install`) and the check shows up on Spatie's
`/health` dashboard the next time the app boots.

## Attribute reference

```php
#[AsHealthCheck(
    name:      'ai.pgvector',                                 // required — unique dot slug
    label:     'pgvector extension',                          // optional — dashboard label
    schedule:  '5 * * * *',                                   // optional — cron expression
    enabled:   true,                                          // optional — static switch
    channel:   HealthNotificationChannel::SlackPlatformEng,   // optional — routing
    condition: 'shouldRun',                                   // optional — runtime gate
)]
```

- **`name`** — required. Convention: `<domain>.<subsystem>[.<detail>]`.
  Must be unique across every discovered check.
- **`label`** — human-readable dashboard label. Defaults to a
  title-cased `name`.
- **`schedule`** — cron expression controlling how often the check
  runs. Defaults to Spatie's built-in "every minute".
- **`enabled`** — static disable switch. Prefer `condition` for
  runtime gating.
- **`channel`** — logical
  {@see \Academorix\Health\Enums\HealthNotificationChannel} case.
  App config translates the case to a concrete notifiable.
- **`condition`** — name of a `public static bool`-returning method
  on the same class. Called once at boot; check is skipped when it
  returns `false`. Use for environment-specific gating.

## Runtime-conditional registration

Because PHP evaluates attributes statically, `config(...)` / `env(...)`
CAN'T be used as attribute values. For runtime gates, add a
`public static function shouldRun(): bool` on the check class and
reference it via `condition`:

```php
#[AsHealthCheck(
    name: 'cache.redis.primary',
    condition: 'shouldRun',
)]
final class RedisPrimaryCheck extends Check
{
    public static function shouldRun(): bool
    {
        return config('cache.default') === 'redis';
    }

    public function run(): Result { /* ... */ }
}
```

## Notification channels

```php
enum HealthNotificationChannel: string
{
    case SlackPlatformEng = 'slack.platform-eng';
    case SlackOps         = 'slack.ops';
    case SlackSecurity    = 'slack.security';
    case PagerDuty        = 'pagerduty';
    case Email            = 'email';
    case LogOnly          = 'log';
}
```

Every case is mapped to a concrete notifiable in the app's
`config/health.php`. Adding a new channel means editing three
places: the enum, `HealthNotificationConfig::resolveChannel()`
(if the driver needs bespoke handling), and every app's
`config/health.php`.

## Programmatic contribution

**Not supported.** The attribute path handles every use case. If
you find yourself wanting programmatic registration, one of these
applies:

- **Your check needs DI** — that already works. Constructor
  injection is honored because the discoverer uses
  `$container->make($className)` instead of `::new()`.
- **Your check is data-driven** — write one attribute-marked class
  per logical check, or wrap the iteration inside `run()` and
  return a compound `Result`.
- **Your check is environment-conditional** — use the `condition:`
  field on the attribute.

If none of the above cover your case, open an issue with the
concrete scenario before adding a new registration path.

## Diagnostic commands

Two Laravel-native commands come for free once you have Spatie's
Health installed:

```bash
php artisan health:check      # run every check once, tabular output
php artisan health:list       # list registered checks + their schedules
```

## Architecture

The package is intentionally thin. Three responsibilities, three
files:

1. **Attribute** — `src/Attributes/AsHealthCheck.php` — the marker.
2. **Discoverer** — `src/Support/HealthCheckDiscoverer.php` —
   iterates collected attributes, applies invariants, hands
   fully-configured `Check` instances back.
3. **Service provider** — `src/Providers/HealthServiceProvider.php`
   — the seam that runs discovery at the right boot phase and
   registers the result with Spatie.

Everything else is glue.

## Testing

```bash
pnpm turbo run test --filter=@academorix/health
```

## Related

- Notification routing: `src/Support/HealthNotificationConfig.php`
- Discoverer: `src/Support/HealthCheckDiscoverer.php`
- Config baseline: `config/health.php`
- Downstream consumer: `packages/ai` (AI service's pgvector check)
