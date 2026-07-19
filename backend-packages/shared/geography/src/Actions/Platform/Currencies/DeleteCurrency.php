<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Currencies;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\Currency;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/platform/geography/currencies/{currency}` —
 * platform admin deletes a currency row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.currencies.delete')]
#[Delete('/api/v1/platform/geography/currencies/{currency}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class DeleteCurrency
{
    use AsController;

    public function __construct(
        private readonly CurrencyRepositoryInterface $currencies,
    ) {
    }

    public function __invoke(Currency $currency): JsonResponse
    {
        $this->currencies->delete((string) $currency->getKey());

        return \response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
