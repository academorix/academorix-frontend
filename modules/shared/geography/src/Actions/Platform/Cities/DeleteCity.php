<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Cities;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\CityRepositoryInterface;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\City;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
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
