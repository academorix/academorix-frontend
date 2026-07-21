<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform\States;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\StateRepositoryInterface;
use Stackra\Geography\Data\Requests\UpdateStateRequestData;
use Stackra\Geography\Data\Resources\StateResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\State;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/geography/states/{state}` — platform admin
 * updates a state row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.states.update')]
#[Patch('/api/v1/platform/geography/states/{state}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class UpdateState
{
    use AsController;

    public function __construct(
        private readonly StateRepositoryInterface $states,
    ) {
    }

    public function __invoke(State $state, UpdateStateRequestData $data): StateResourceData
    {
        $updated = $this->states->update((string) $state->getKey(), $data->toArray());

        return StateResourceData::fromModel($updated);
    }
}
