<?php

/**
 * @file packages/scheduling/src/Attributes/Schedule.php
 *
 * @description
 * Class-level, repeatable attribute that attaches a named cadence
 * to a Job or Command. Read at boot by
 * {@see \Stackra\Scheduling\Support\ScheduleDiscovery} and
 * turned into a Laravel scheduled event by
 * {@see \Stackra\Scheduling\Support\ScheduleRegistrar}.
 *
 * Repeatable — a single class may run at more than one cadence
 * (e.g. once hourly + once daily) by stacking the attribute:
 *
 *     #[Schedule(Frequency::Hourly)]
 *     #[Schedule(Frequency::Daily)]
 *     final class ReconcileInvoicesJob { ... }
 *
 * Mutually exclusive with {@see Cron} on the same class — pick
 * one source of cadence. The registrar treats any class carrying
 * BOTH attributes as a configuration error (see the discovery
 * layer for the exact behaviour).
 */

declare(strict_types=1);

namespace Stackra\Scheduling\Attributes;

use Stackra\Scheduling\Enums\Frequency;
use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final class Schedule
{
    /**
     * @param  Frequency  $frequency  Named cadence — see the {@see Frequency} enum for the full list.
     */
    public function __construct(
        public readonly Frequency $frequency,
    ) {}
}
