<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Academorix\Events\Attributes\AsEvent;
/**
 * Fired after a city row is persisted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class CityCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int  $cityId     Numeric primary key.
     * @param  int  $stateId    Parent state primary key.
     * @param  int  $countryId  Parent country primary key.
     */
    public function __construct(
        public int $cityId,
        public int $stateId,
        public int $countryId,
    ) {
    }
}
