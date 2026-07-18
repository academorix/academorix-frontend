<?php

/**
 * @file packages/foundation/src/Support/SystemClock.php
 *
 * @description
 * Default {@see \Academorix\Foundation\Contracts\Clock} implementation.
 * Delegates to Laravel's `Carbon` helper so timezone / testing hooks
 * (`Carbon::setTestNow(...)`) still work — but production code should
 * prefer the {@see \Academorix\Foundation\Support\FrozenClock} test
 * double over `Carbon::setTestNow()` to avoid polluting global state.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Support;

use Academorix\Foundation\Contracts\Clock;
use Illuminate\Support\Carbon;

final class SystemClock implements Clock
{
    public function now(): Carbon
    {
        return Carbon::now();
    }
}
