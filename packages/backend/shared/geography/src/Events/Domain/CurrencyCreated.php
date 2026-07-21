<?php

declare(strict_types=1);

namespace Stackra\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Stackra\Events\Attributes\AsEvent;
/**
 * Fired after a currency row is persisted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
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
