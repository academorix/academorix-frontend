<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\States;

use Stackra\Geography\Contracts\Repositories\StateRepositoryInterface;
use Stackra\Geography\Data\Resources\StateResourceData;
use Stackra\Geography\Models\State;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/states` — requires `?filter[country_id]=` to
 * avoid a ~5000-row full-table scan. Refused via
 * {@see StateRepositoryInterface::refuseUnscopedIndex()} when the
 * filter is missing.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.states.list')]
#[Get('/api/v1/geography/states')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListStates
{
    use AsController;

    public function __construct(
        private readonly StateRepositoryInterface $states,
    ) {
    }

    /**
     * @return DataCollection<int, StateResourceData>
     */
    public function __invoke(Request $request): DataCollection
    {
        $countryId = $request->query('filter.country_id');

        // Refuse the unscoped read — the repository throws a 422 with
        // a stable error code that the response envelope converts to
        // the wire shape.
        if ($countryId === null) {
            $this->states->refuseUnscopedIndex();
        }

        $rows = $this->states->findByCountry((int) $countryId)
            ->map(static fn (State $s): StateResourceData => StateResourceData::fromModel($s));

        return new DataCollection(StateResourceData::class, $rows);
    }
}
