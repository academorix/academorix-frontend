<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Academorix\Events\Attributes\AsEvent;
/**
 * Fired after a state row is persisted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class StateCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int  $stateId    Numeric primary key.
     * @param  int  $countryId  Parent country primary key.
     */
    public function __construct(
        public int $stateId,
        public int $countryId,
    ) {
    }
}
