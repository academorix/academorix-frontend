<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Timezones;

use Stackra\Geography\Data\Resources\TimezoneResourceData;
use Stackra\Geography\Models\Timezone;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/geography/timezones/{timezone}` — public timezone show.
 * Route binding accepts numeric PK OR the URL-encoded IANA name.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.timezones.show')]
#[Get('/api/v1/geography/timezones/{timezone}')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ShowTimezone
{
    use AsController;

    public function __invoke(Timezone $timezone): TimezoneResourceData
    {
        return TimezoneResourceData::fromModel($timezone);
    }
}
