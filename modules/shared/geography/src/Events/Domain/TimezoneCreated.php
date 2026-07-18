<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a timezone row is persisted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class TimezoneCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int     $timezoneId  Numeric primary key.
     * @param  string  $name        IANA name.
     */
    public function __construct(
        public int $timezoneId,
        public string $name,
    ) {
    }
}
