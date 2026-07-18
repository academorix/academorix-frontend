<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Timezones;

use Academorix\Geography\Contracts\Repositories\TimezoneRepositoryInterface;
use Academorix\Geography\Data\Resources\TimezoneResourceData;
use Academorix\Geography\Models\Timezone;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/timezones` — public list of IANA timezones.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.timezones.list')]
#[Get('/api/v1/geography/timezones')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListTimezones
{
    use AsController;

    public function __construct(
        private readonly TimezoneRepositoryInterface $timezones,
    ) {
    }

    /**
     * @return DataCollection<int, TimezoneResourceData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->timezones->all()
            ->map(static fn (Timezone $t): TimezoneResourceData => TimezoneResourceData::fromModel($t));

        return new DataCollection(TimezoneResourceData::class, $rows);
    }
}
