<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a city row is updated.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class CityUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int           $cityId         Numeric primary key.
     * @param  list<string>  $changedFields  Column names touched by the update.
     */
    public function __construct(
        public int $cityId,
        public array $changedFields,
    ) {
    }
}
