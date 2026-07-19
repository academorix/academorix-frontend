<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a currency row is persisted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class CurrencyCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int     $currencyId  Numeric primary key.
     * @param  string  $code        ISO-4217 alpha code.
     */
    public function __construct(
        public int $currencyId,
        public string $code,
    ) {
    }
}
