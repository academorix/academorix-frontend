<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Academorix\Events\Attributes\AsEvent;
/**
 * Fired after a timezone row is deleted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class TimezoneDeleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int     $timezoneId  Numeric primary key of the removed row.
     * @param  string  $name        IANA name of the removed row.
     */
    public function __construct(
        public int $timezoneId,
        public string $name,
    ) {
    }
}
