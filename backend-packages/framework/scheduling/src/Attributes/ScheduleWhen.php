<?php

/**
 * @file packages/scheduling/src/Attributes/ScheduleWhen.php
 *
 * @description
 * Class-level, repeatable attribute that gates the schedule on an
 * invokable predicate class. The registrar wraps the schedule
 * with Laravel's `->when(fn)` — the closure resolves the gate
 * from the container and invokes it, so the task only runs when
 * every gate returns `true`.
 *
 * ## Gate contract
 *
 * The referenced class MUST implement
 * {@see \Academorix\Scheduling\Contracts\ScheduleGate} — a single
 * invokable method returning `bool`. Gate classes are resolved
 * from the container, so they get full DI (config, cache,
 * repositories) — never request state.
 *
 * ## Multiple gates AND together
 *
 * Repeatable — stacking the attribute adds another gate. The
 * task runs only when ALL gates return `true`:
 *
 *     #[Schedule(Frequency::EveryFifteenMinutes)]
 *     #[ScheduleWhen(InsideBusinessHours::class)]
 *     #[ScheduleWhen(FeatureFlagEnabled::class)]
 *     final class NotifyOverdueInvoicesJob { ... }
 */

declare(strict_types=1);

namespace Academorix\Scheduling\Attributes;

use Academorix\Scheduling\Contracts\ScheduleGate;
use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final class ScheduleWhen
{
    /**
     * @param  class-string<ScheduleGate>  $gate  Fully-qualified class name of an invokable gate.
     */
    public function __construct(
        public readonly string $gate,
    ) {}
}
