<?php

/**
 * @file packages/scheduling/src/Attributes/Timezone.php
 *
 * @description
 * Class-level attribute that overrides the timezone used to
 * evaluate the schedule expression for a single task via
 * Laravel's `->timezone(...)` call.
 *
 * Useful when the app runs in one timezone but a specific task
 * follows another — a Casablanca-based tenant reconciliation
 * that must run at Riyadh local midnight, for example.
 *
 * Not repeatable — one timezone per task.
 */

declare(strict_types=1);

namespace Stackra\Scheduling\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class Timezone
{
    /**
     * @param  string  $timezone  Any valid PHP timezone identifier — e.g. `'Africa/Casablanca'`, `'UTC'`, `'America/New_York'`.
     */
    public function __construct(
        public readonly string $timezone,
    ) {}
}
