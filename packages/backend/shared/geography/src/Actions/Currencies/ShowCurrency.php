<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Currencies;

use Stackra\Geography\Data\Resources\CurrencyResourceData;
use Stackra\Geography\Models\Currency;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/geography/currencies/{currency}` — public currency
 * show. Route binding accepts numeric PK OR ISO-4217 code.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.currencies.show')]
#[Get('/api/v1/geography/currencies/{currency}')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ShowCurrency
{
    use AsController;

    public function __invoke(Currency $currency): CurrencyResourceData
    {
        return CurrencyResourceData::fromModel($currency);
    }
}
