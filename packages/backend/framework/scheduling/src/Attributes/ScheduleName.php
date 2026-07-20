<?php

/**
 * @file packages/scheduling/src/Attributes/ScheduleName.php
 *
 * @description
 * Class-level attribute that overrides the schedule task name via
 * Laravel's `->name(...)`. The name appears in the scheduler's
 * output — `php artisan schedule:list` — and in the shared cache
 * key used by `withoutOverlapping` / `onOneServer`.
 *
 * ## When to use
 *
 *   - Two schedule attributes on the same class need different
 *     overlap locks (e.g. `#[Schedule(Hourly)]` +
 *     `#[Schedule(Daily)]` — you may want each to have its own
 *     name so they don't share a lock).
 *   - Dashboards / log lines are easier to read with a
 *     human-readable label than a fully-qualified class name.
 *
 * Not repeatable — one name per task.
 */

declare(strict_types=1);

namespace Academorix\Scheduling\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class ScheduleName
{
    /**
     * @param  string  $name  Human-readable identifier — e.g. `'sync-stripe-invoices'`.
     */
    public function __construct(
        public readonly string $name,
    ) {}
}
