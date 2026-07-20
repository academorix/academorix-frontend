<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Academorix\Events\Attributes\AsEvent;
/**
 * Fired after a country row is updated.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class CountryUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int           $countryId      Numeric primary key.
     * @param  string        $iso2           ISO-3166 alpha-2.
     * @param  list<string>  $changedFields  Column names touched by the update.
     */
    public function __construct(
        public int $countryId,
        public string $iso2,
        public array $changedFields,
    ) {
    }
}
