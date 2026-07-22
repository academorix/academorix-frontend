<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\TimezoneRepositoryInterface;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\Timezone;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
