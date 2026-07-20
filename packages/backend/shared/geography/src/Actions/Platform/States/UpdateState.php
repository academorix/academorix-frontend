<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\States;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\StateRepositoryInterface;
use Academorix\Geography\Data\Requests\UpdateStateRequestData;
use Academorix\Geography\Data\Resources\StateResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\State;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
