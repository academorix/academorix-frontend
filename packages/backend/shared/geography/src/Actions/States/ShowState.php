<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\States;

use Stackra\Geography\Data\Resources\StateResourceData;
use Stackra\Geography\Models\State;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/geography/states/{state}` — public state show.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.states.show')]
#[Get('/api/v1/geography/states/{state}')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ShowState
{
    use AsController;

    public function __invoke(State $state): StateResourceData
    {
        return StateResourceData::fromModel($state);
    }
}
