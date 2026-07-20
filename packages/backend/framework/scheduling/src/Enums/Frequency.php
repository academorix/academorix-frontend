<?php

/**
 * @file packages/scheduling/src/Enums/Frequency.php
 *
 * @description
 * Named cadence for the `#[Schedule(...)]` attribute. Every case
 * maps onto a single Laravel scheduler builder method — the
 * {@see self::apply()} method is what
 * {@see \Academorix\Scheduling\Support\ScheduleRegistrar}
 * calls at boot to turn declarative metadata into a concrete
 * scheduled event.
 *
 * The enum exists so callers write `Frequency::Daily` instead of
 * the stringly-typed `'daily'` used in Laravel's kernel example
 * docs. It gives us IDE autocomplete, phpstan level 8 checks, and
 * a single seam for adding new cadences that Laravel supports.
 *
 * ## Design notes
 *
 *   - Backed by string so the value survives a JSON serialisation
 *     of the discovery cache without any custom `__set_state`
 *     plumbing.
 *   - `apply()` returns the same {@see Event} instance so it can be
 *     chained fluently with the modifier calls (`->withoutOverlapping()`,
 *     `->onOneServer()`, ...).
 *   - No case takes arguments — the enum is a pure identifier. Ad-hoc
 *     cadences ("weekly on Mondays at 07:30") live under `#[Cron(...)]`
 *     with a raw expression instead of a bespoke enum case.
 */

declare(strict_types=1);

namespace Academorix\Scheduling\Enums;

use Illuminate\Console\Scheduling\Event;
use Academorix\Enum\Enum;

enum Frequency: string
{
    use Enum;

    /**
     * Every minute. The most frequent cadence Laravel exposes as a
     * named helper. Beware — heavy jobs at this cadence require
     * {@see \Academorix\Scheduling\Attributes\WithoutOverlapping}
     * or the queue backlog will grow unbounded.
     */
    case EveryMinute = 'every_minute';

    /** Every two minutes. */
    case EveryTwoMinutes = 'every_two_minutes';

    /** Every five minutes. */
    case EveryFiveMinutes = 'every_five_minutes';

    /** Every ten minutes. */
    case EveryTenMinutes = 'every_ten_minutes';

    /** Every fifteen minutes. */
    case EveryFifteenMinutes = 'every_fifteen_minutes';

    /** Every thirty minutes. */
    case EveryThirtyMinutes = 'every_thirty_minutes';

    /** Once per hour on the top of the hour. */
    case Hourly = 'hourly';

    /** Once per day at midnight. */
    case Daily = 'daily';

    /** Once per week on Sunday at midnight. */
    case Weekly = 'weekly';

    /** Once per month on the 1st at midnight. */
    case Monthly = 'monthly';

    /** Once per quarter on the 1st of Jan / Apr / Jul / Oct at midnight. */
    case Quarterly = 'quarterly';

    /** Once per year on 1st January at midnight. */
    case Yearly = 'yearly';

    /**
     * Apply this frequency to a Laravel scheduler event. The event
     * builder methods return the same event, so the caller can
     * continue to chain modifier calls on the returned value.
     *
     * @param  Event  $event  A scheduled event fresh from `Schedule::job(...)` or `Schedule::command(...)`.
     * @return Event The same event, now carrying the cadence.
     */
    public function apply(Event $event): Event
    {
        return match ($this) {
            self::EveryMinute => $event->everyMinute(),
            self::EveryTwoMinutes => $event->everyTwoMinutes(),
            self::EveryFiveMinutes => $event->everyFiveMinutes(),
            self::EveryTenMinutes => $event->everyTenMinutes(),
            self::EveryFifteenMinutes => $event->everyFifteenMinutes(),
            self::EveryThirtyMinutes => $event->everyThirtyMinutes(),
            self::Hourly => $event->hourly(),
            self::Daily => $event->daily(),
            self::Weekly => $event->weekly(),
            self::Monthly => $event->monthly(),
            self::Quarterly => $event->quarterly(),
            self::Yearly => $event->yearly(),
        };
    }
}
