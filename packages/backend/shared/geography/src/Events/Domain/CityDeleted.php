<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Academorix\Events\Attributes\AsEvent;
/**
 * Fired after a city row is deleted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class CityDeleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int  $cityId  Numeric primary key of the removed row.
     */
    public function __construct(
        public int $cityId,
    ) {
    }
}
