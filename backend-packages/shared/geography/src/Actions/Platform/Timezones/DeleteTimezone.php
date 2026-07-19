<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Timezones;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\TimezoneRepositoryInterface;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\Timezone;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/platform/geography/timezones/{timezone}` — platform
 * admin deletes a timezone row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.timezones.delete')]
#[Delete('/api/v1/platform/geography/timezones/{timezone}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class DeleteTimezone
{
    use AsController;

    public function __construct(
        private readonly TimezoneRepositoryInterface $timezones,
    ) {
    }

    public function __invoke(Timezone $timezone): JsonResponse
    {
        $this->timezones->delete((string) $timezone->getKey());

        return \response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
