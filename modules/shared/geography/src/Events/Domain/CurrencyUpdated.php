<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a currency row is updated.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class CurrencyUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int           $currencyId     Numeric primary key.
     * @param  string        $code           ISO-4217 alpha code.
     * @param  list<string>  $changedFields  Column names touched by the update.
     */
    public function __construct(
        public int $currencyId,
        public string $code,
        public array $changedFields,
    ) {
    }
}
