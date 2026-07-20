# academorix/scheduling

Attribute-first task scheduling for the Academorix monorepo. Attach
`#[Schedule]`, `#[Cron]` and their modifier attributes to a Job or Command class
and it is registered on Laravel's scheduler at boot time — no edits to
`app/Console/Kernel.php` and no `routes/console.php` entries.

Depends on [`academorix/foundation`](../foundation).

## What you get in one line

Drop an attribute on a Job:

```php
<?php

declare(strict_types=1);

namespace Academorix\Billing\Jobs;

use Academorix\Scheduling\Attributes\Environments;
use Academorix\Scheduling\Attributes\OnOneServer;
use Academorix\Scheduling\Attributes\Schedule;
use Academorix\Scheduling\Attributes\WithoutOverlapping;
use Academorix\Scheduling\Enums\Frequency;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

#[Schedule(Frequency::Hourly)]
#[Schedule(Frequency::Daily)]
#[WithoutOverlapping(ttlMinutes: 5)]
#[OnOneServer]
#[Environments('production', 'staging')]
final class SyncStripeInvoicesJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function handle(): void
    {
        // ...
    }
}
```

At boot the `SchedulingServiceProvider` calls
`Schedule::job(SyncStripeInvoicesJob::class)` twice (once for the hourly
cadence, once for daily), wraps both events with `->withoutOverlapping(5)`,
`->onOneServer()`, and `->environments(['production', 'staging'])`.

Nothing else to do.

## Attributes

All attributes live under `Academorix\Scheduling\Attributes\`.

### Class-level — pick one cadence source

| Attribute                      | Purpose                                                                                 | Repeatable |
| ------------------------------ | --------------------------------------------------------------------------------------- | ---------- |
| `#[Schedule(Frequency)]`       | Named frequency from the `Frequency` enum (`Daily`, `Hourly`, `EveryFiveMinutes`, ...). | yes        |
| `#[Cron('*/15 9-17 * * 1-5')]` | Raw cron expression. Mutually exclusive with `#[Schedule]` on the same class.           | yes        |

### Class-level — modifiers

| Attribute                                  | Effect on the scheduled event                                           |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `#[WithoutOverlapping(ttlMinutes: 5)]`     | `->withoutOverlapping(5)` — lock TTL in minutes.                        |
| `#[OnOneServer]`                           | `->onOneServer()` — requires an atomic-lock cache driver.               |
| `#[RunInBackground]`                       | `->runInBackground()` — non-blocking.                                   |
| `#[Environments('production', 'staging')]` | `->environments([...])` — env whitelist.                                |
| `#[RunInMaintenanceMode]`                  | `->evenInMaintenanceMode()` — bypasses `php artisan down`.              |
| `#[Timezone('Africa/Casablanca')]`         | `->timezone(...)` — per-schedule tz override.                           |
| `#[ScheduleWhen(GateClass::class)]`        | `->when($gate)` — invokable predicate. Repeatable — gates AND together. |
| `#[ScheduleName('sync-stripe-invoices')]`  | `->name(...)` — override the schedule task name for logs / dashboards.  |

## The `ScheduleGate` contract

`#[ScheduleWhen]` points at any class implementing
`Academorix\Scheduling\Contracts\ScheduleGate`:

```php
final class InsideBusinessHours implements ScheduleGate
{
    public function __invoke(): bool
    {
        $hour = (int) now()->format('H');

        return $hour >= 9 && $hour < 17;
    }
}

#[Schedule(Frequency::EveryFifteenMinutes)]
#[ScheduleWhen(InsideBusinessHours::class)]
final class NotifyOverdueInvoicesJob implements ShouldQueue { /* ... */ }
```

Gate classes are resolved from the container, so they receive full DI — request
state is off-limits (the scheduler runs from CLI), but config, cache, and
repositories are all fair game.

## Public API

| Namespace                                                   | Purpose                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `Academorix\Scheduling\Attributes\*`                        | The class-level attributes callers actually apply.        |
| `Academorix\Scheduling\Enums\Frequency`                     | Named cadence backing `#[Schedule(...)]`.                 |
| `Academorix\Scheduling\Support\ScheduledTask`               | Readonly value object describing one registered schedule. |
| `Academorix\Scheduling\Support\ScheduleDiscovery`           | Scans the `olvlvl/composer-attribute-collector` manifest. |
| `Academorix\Scheduling\Support\ScheduleRegistrar`           | Applies discovered tasks to Laravel's `Schedule`.         |
| `Academorix\Scheduling\Contracts\ScheduleGate`              | Invokable predicate for `#[ScheduleWhen]`.                |
| `Academorix\Scheduling\Providers\SchedulingServiceProvider` | Wires everything up on Laravel boot.                      |

## Testing

```bash
pnpm turbo run test --filter=@academorix/scheduling
```

See parent [`docs/package-authoring.md`](../../docs/package-authoring.md).
