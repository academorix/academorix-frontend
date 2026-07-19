<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a country row is persisted.
 *
 * Consumed by cache-invalidation listeners; downstream integrations
 * (localization region-defaults, notifications) subscribe as needed.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class CountryCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int     $countryId  Numeric primary key.
     * @param  string  $iso2       ISO-3166 alpha-2.
     */
    public function __construct(
        public int $countryId,
        public string $iso2,
    ) {
    }
}
