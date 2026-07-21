<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform\Timezones;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\TimezoneRepositoryInterface;
use Stackra\Geography\Data\Requests\UpdateTimezoneRequestData;
use Stackra\Geography\Data\Resources\TimezoneResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\Timezone;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/geography/timezones/{timezone}` — platform
 * admin updates a timezone row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.timezones.update')]
#[Patch('/api/v1/platform/geography/timezones/{timezone}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class UpdateTimezone
{
    use AsController;

    public function __construct(
        private readonly TimezoneRepositoryInterface $timezones,
    ) {
    }

    public function __invoke(Timezone $timezone, UpdateTimezoneRequestData $data): TimezoneResourceData
    {
        $updated = $this->timezones->update((string) $timezone->getKey(), $data->toArray());

        return TimezoneResourceData::fromModel($updated);
    }
}
