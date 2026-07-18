<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Currencies;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Academorix\Geography\Data\Requests\UpdateCurrencyRequestData;
use Academorix\Geography\Data\Resources\CurrencyResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\Currency;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
