<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\States;

use Academorix\Geography\Data\Resources\StateResourceData;
use Academorix\Geography\Models\State;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

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
