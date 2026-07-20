<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\States;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Data\StateInterface;
use Academorix\Geography\Contracts\Repositories\StateRepositoryInterface;
use Academorix\Geography\Data\Requests\CreateStateRequestData;
use Academorix\Geography\Data\Resources\StateResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/geography/states` — platform admin creates
 * a state row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.states.create')]
#[Post('/api/v1/platform/geography/states')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class CreateState
{
    use AsController;

    public function __construct(
        private readonly StateRepositoryInterface $states,
    ) {
    }

    public function __invoke(CreateStateRequestData $data): StateResourceData
    {
        $state = $this->states->create([
            StateInterface::ATTR_COUNTRY_ID   => $data->countryId,
            StateInterface::ATTR_NAME         => $data->name,
            StateInterface::ATTR_COUNTRY_CODE => $data->countryCode,
            StateInterface::ATTR_STATE_CODE   => $data->stateCode,
            StateInterface::ATTR_TYPE         => $data->type,
            StateInterface::ATTR_LATITUDE     => $data->latitude,
            StateInterface::ATTR_LONGITUDE    => $data->longitude,
        ]);

        return StateResourceData::fromModel($state);
    }
}
