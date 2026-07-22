<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\Currency;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
