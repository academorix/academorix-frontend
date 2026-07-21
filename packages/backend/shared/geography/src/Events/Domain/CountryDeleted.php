<?php

declare(strict_types=1);

namespace Stackra\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Stackra\Events\Attributes\AsEvent;
/**
 * Fired after a country row is deleted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class CountryDeleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int     $countryId  Numeric primary key of the removed row.
     * @param  string  $iso2       ISO-3166 alpha-2 of the removed row.
     */
    public function __construct(
        public int $countryId,
        public string $iso2,
    ) {
    }
}
