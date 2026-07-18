<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a currency row is deleted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class CurrencyDeleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int     $currencyId  Numeric primary key of the removed row.
     * @param  string  $code        ISO-4217 alpha code of the removed row.
     */
    public function __construct(
        public int $currencyId,
        public string $code,
    ) {
    }
}
