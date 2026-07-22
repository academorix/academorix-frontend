<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\CityRepositoryInterface;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\City;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/platform/geography/cities/{city}` — platform admin
 * deletes a city row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.cities.delete')]
#[Delete('/api/v1/platform/geography/cities/{city}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class DeleteCity
{
    use AsController;

    public function __construct(
        private readonly CityRepositoryInterface $cities,
    ) {
    }

    public function __invoke(City $city): JsonResponse
    {
        $this->cities->delete((string) $city->getKey());

        return \response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
