<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Countries;

use Stackra\Geography\Contracts\Repositories\StateRepositoryInterface;
use Stackra\Geography\Data\Resources\StateResourceData;
use Stackra\Geography\Models\Country;
use Stackra\Geography\Models\State;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
