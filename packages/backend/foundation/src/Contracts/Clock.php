<?php

/**
 * @file packages/foundation/src/Contracts/Clock.php
 *
 * @description
 * PSR-20-style clock abstraction. Every domain package that needs "now"
 * MUST resolve `Clock` from the container instead of calling `now()`,
 * `time()`, `new \DateTimeImmutable()`, or `Carbon::now()` directly.
 * Tests bind a fake `Clock` to freeze / advance time deterministically.
 *
 * Two implementations ship in Foundation:
 *
 *   - {@see \Stackra\Foundation\Support\SystemClock} — real clock.
 *   - {@see \Stackra\Foundation\Support\FrozenClock} — test double.
 *
 * `now()` returns Carbon so it fits Laravel-first codebases; consumers
 * that want a plain `DateTimeImmutable` can call `->toImmutable()`.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Contracts;

use Illuminate\Support\Carbon;

interface Clock
{
    public function now(): Carbon;
}
