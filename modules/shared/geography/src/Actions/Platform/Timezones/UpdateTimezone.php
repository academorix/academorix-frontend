<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Timezones;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\TimezoneRepositoryInterface;
use Academorix\Geography\Data\Requests\UpdateTimezoneRequestData;
use Academorix\Geography\Data\Resources\TimezoneResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\Timezone;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
