<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a state row is deleted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class StateDeleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int  $stateId    Numeric primary key of the removed row.
     * @param  int  $countryId  Parent country primary key.
     */
    public function __construct(
        public int $stateId,
        public int $countryId,
    ) {
    }
}
