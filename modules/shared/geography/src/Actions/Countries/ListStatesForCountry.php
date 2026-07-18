<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Countries;

use Academorix\Geography\Contracts\Repositories\StateRepositoryInterface;
use Academorix\Geography\Data\Resources\StateResourceData;
use Academorix\Geography\Models\Country;
use Academorix\Geography\Models\State;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/countries/{country}/states` — states scoped
 * to one country.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.countries.states.list')]
#[Get('/api/v1/geography/countries/{country}/states')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListStatesForCountry
{
    use AsController;

    public function __construct(
        private readonly StateRepositoryInterface $states,
    ) {
    }

    /**
     * @return DataCollection<int, StateResourceData>
     */
    public function __invoke(Country $country): DataCollection
    {
        $rows = $this->states->findByCountry((int) $country->getKey())
            ->map(static fn (State $s): StateResourceData => StateResourceData::fromModel($s));

        return new DataCollection(StateResourceData::class, $rows);
    }
}
