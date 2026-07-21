<?php

/**
 * @file packages/foundation/src/Support/FrozenClock.php
 *
 * @description
 * In-memory {@see \Stackra\Foundation\Contracts\Clock} for tests.
 * Freezes `now()` at construction; `advance(...)` shifts the clock by
 * a `\DateInterval` or seconds. Bind in Pest tests via:
 *
 *     $this->app->bind(Clock::class, fn () => new FrozenClock('2026-07-10T09:00:00Z'));
 */

declare(strict_types=1);

namespace Stackra\Foundation\Support;

use Stackra\Foundation\Contracts\Clock;
use DateInterval;
use DateTimeInterface;
use Illuminate\Support\Carbon;

final class FrozenClock implements Clock
{
    private Carbon $now;

    public function __construct(DateTimeInterface|string $now = 'now')
    {
        $this->now = $now instanceof DateTimeInterface
            ? Carbon::instance($now)
            : Carbon::parse($now);
    }

    public function now(): Carbon
    {
        return $this->now->copy();
    }

    public function advance(DateInterval|int $by): void
    {
        $this->now = $by instanceof DateInterval
            ? $this->now->add($by)
            : $this->now->addSeconds($by);
    }

    public function setTo(DateTimeInterface|string $moment): void
    {
        $this->now = $moment instanceof DateTimeInterface
            ? Carbon::instance($moment)
            : Carbon::parse($moment);
    }
}
