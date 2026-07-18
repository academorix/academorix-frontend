<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Currencies;

use Academorix\Geography\Data\Resources\CurrencyResourceData;
use Academorix\Geography\Models\Currency;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

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
