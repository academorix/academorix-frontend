<?php

/**
 * @file packages/scheduling/src/Attributes/WithoutOverlapping.php
 *
 * @description
 * Class-level marker attribute. When present, the registrar wraps
 * the schedule with Laravel's `->withoutOverlapping()` guard —
 * subsequent invocations of the same task are skipped while a
 * prior run is still in flight.
 *
 * The optional `$ttlMinutes` argument caps how long the overlap
 * lock survives before it is considered stale — useful when the
 * scheduler process itself may crash without releasing the lock.
 *
 * Not repeatable — either you want the overlap guard or you don't.
 */

declare(strict_types=1);

namespace Stackra\Scheduling\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class WithoutOverlapping
{
    /**
     * @param  int|null  $ttlMinutes  Optional lock TTL in minutes. `null` uses Laravel's default (24 hours).
     */
    public function __construct(
        public readonly ?int $ttlMinutes = null,
    ) {}
}
