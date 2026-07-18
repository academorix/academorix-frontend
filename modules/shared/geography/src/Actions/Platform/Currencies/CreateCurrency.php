<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Currencies;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Data\CurrencyInterface;
use Academorix\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Academorix\Geography\Data\Requests\CreateCurrencyRequestData;
use Academorix\Geography\Data\Resources\CurrencyResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/geography/currencies` — platform admin
 * creates a currency row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.currencies.create')]
#[Post('/api/v1/platform/geography/currencies')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class CreateCurrency
{
    use AsController;

    public function __construct(
        private readonly CurrencyRepositoryInterface $currencies,
    ) {
    }

    public function __invoke(CreateCurrencyRequestData $data): CurrencyResourceData
    {
        $currency = $this->currencies->create([
            CurrencyInterface::ATTR_COUNTRY_ID    => $data->countryId,
            CurrencyInterface::ATTR_NAME          => $data->name,
            CurrencyInterface::ATTR_CODE          => $data->code,
            CurrencyInterface::ATTR_SYMBOL        => $data->symbol,
            CurrencyInterface::ATTR_SYMBOL_NATIVE => $data->symbolNative,
            CurrencyInterface::ATTR_PRECISION     => $data->precision,
        ]);

        return CurrencyResourceData::fromModel($currency);
    }
}
