<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform\Currencies;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Stackra\Geography\Data\Requests\UpdateCurrencyRequestData;
use Stackra\Geography\Data\Resources\CurrencyResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\Currency;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/geography/currencies/{currency}` — platform
 * admin updates a currency row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.currencies.update')]
#[Patch('/api/v1/platform/geography/currencies/{currency}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class UpdateCurrency
{
    use AsController;

    public function __construct(
        private readonly CurrencyRepositoryInterface $currencies,
    ) {
    }

    public function __invoke(Currency $currency, UpdateCurrencyRequestData $data): CurrencyResourceData
    {
        $updated = $this->currencies->update((string) $currency->getKey(), $data->toArray());

        return CurrencyResourceData::fromModel($updated);
    }
}
