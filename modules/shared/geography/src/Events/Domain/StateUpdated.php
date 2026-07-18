<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a state row is updated.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class StateUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int           $stateId        Numeric primary key.
     * @param  int           $countryId      Parent country primary key.
     * @param  list<string>  $changedFields  Column names touched by the update.
     */
    public function __construct(
        public int $stateId,
        public int $countryId,
        public array $changedFields,
    ) {
    }
}
