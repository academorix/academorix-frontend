<?php

/**
 * @file packages/scheduling/src/Attributes/Cron.php
 *
 * @description
 * Class-level, repeatable attribute that attaches a raw cron
 * expression to a Job or Command. Preferred over
 * {@see Schedule} when the cadence does NOT fit one of the
 * named {@see \Academorix\Scheduling\Enums\Frequency} cases —
 * things like "every 15 minutes between 09:00 and 17:00 on
 * weekdays" (`*\/15 9-17 * * 1-5`).
 *
 * Repeatable — the same class may run on multiple cron
 * expressions by stacking the attribute:
 *
 *     #[Cron('0 8 * * 1-5')]   // 08:00 on weekdays
 *     #[Cron('0 12 * * 0,6')]  // 12:00 on weekends
 *     final class DailyDigestJob { ... }
 *
 * Mutually exclusive with {@see Schedule} on the same class. The
 * registrar treats any class carrying BOTH attributes as a
 * configuration error.
 */

declare(strict_types=1);

namespace Academorix\Scheduling\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final class Cron
{
    /**
     * @param  string  $expression  Standard five-field cron expression, e.g. `*\/15 9-17 * * 1-5`.
     */
    public function __construct(
        public readonly string $expression,
    ) {}
}
