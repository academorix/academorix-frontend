<?php

/**
 * @file packages/foundation/src/Support/SystemClock.php
 *
 * @description
 * Default {@see \Stackra\Foundation\Contracts\Clock} implementation.
 * Delegates to Laravel's `Carbon` helper so timezone / testing hooks
 * (`Carbon::setTestNow(...)`) still work — but production code should
 * prefer the {@see \Stackra\Foundation\Support\FrozenClock} test
 * double over `Carbon::setTestNow()` to avoid polluting global state.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Support;

use Stackra\Foundation\Contracts\Clock;
use Illuminate\Support\Carbon;

final class SystemClock implements Clock
{
    public function now(): Carbon
    {
        return Carbon::now();
    }
}
