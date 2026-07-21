<?php

declare(strict_types=1);

namespace Stackra\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Stackra\Events\Attributes\AsEvent;
/**
 * Fired after a timezone row is updated.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class TimezoneUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int           $timezoneId     Numeric primary key.
     * @param  string        $name           IANA name.
     * @param  list<string>  $changedFields  Column names touched by the update.
     */
    public function __construct(
        public int $timezoneId,
        public string $name,
        public array $changedFields,
    ) {
    }
}
