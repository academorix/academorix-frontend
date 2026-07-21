<?php

declare(strict_types=1);

namespace Stackra\Geography\Observers;

use Stackra\Geography\Contracts\Data\CurrencyInterface;
use Stackra\Geography\Events\Domain\CurrencyCreated;
use Stackra\Geography\Events\Domain\CurrencyDeleted;
use Stackra\Geography\Events\Domain\CurrencyUpdated;
use Stackra\Geography\Models\Currency;
use InvalidArgumentException;

/**
 * Lifecycle side effects for {@see Currency}.
 *
 * Uppercases the ISO-4217 code, validates precision ∈ [0, 8], and
 * fires the matching domain events.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class CurrencyObserver
{
    /**
     * `saving` — normalise code + validate precision bounds.
     */
    public function saving(Currency $currency): void
    {
        $code = $currency->{CurrencyInterface::ATTR_CODE} ?? null;
        if (\is_string($code) && $code !== '') {
            $currency->{CurrencyInterface::ATTR_CODE} = \strtoupper($code);
        }

        // Precision must be in [0, 8] — JPY = 0, BHD = 3, most currencies = 2.
        $precision = $currency->{CurrencyInterface::ATTR_PRECISION} ?? null;
        if ($precision !== null) {
            $precisionInt = (int) $precision;
            if ($precisionInt < 0 || $precisionInt > 8) {
                throw new InvalidArgumentException(\sprintf(
                    'Currency precision must be between 0 and 8; got %d.',
                    $precisionInt,
                ));
            }
        }
    }

    /**
     * `created` — fire the domain event.
     */
    public function created(Currency $currency): void
    {
        CurrencyCreated::dispatch(
            (int) $currency->getKey(),
            (string) $currency->{CurrencyInterface::ATTR_CODE},
        );
    }

    /**
     * `updated` — fire the domain event with the dirty field list.
     */
    public function updated(Currency $currency): void
    {
        $changes = \array_keys($currency->getChanges());
        if ($changes === []) {
            return;
        }

        CurrencyUpdated::dispatch(
            (int) $currency->getKey(),
            (string) $currency->{CurrencyInterface::ATTR_CODE},
            $changes,
        );
    }

    /**
     * `deleted` — fire the domain event.
     */
    public function deleted(Currency $currency): void
    {
        CurrencyDeleted::dispatch(
            (int) $currency->getKey(),
            (string) $currency->{CurrencyInterface::ATTR_CODE},
        );
    }
}
