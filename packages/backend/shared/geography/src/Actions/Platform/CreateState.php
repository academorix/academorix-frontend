<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Data\StateInterface;
use Stackra\Geography\Contracts\Repositories\StateRepositoryInterface;
use Stackra\Geography\Data\Requests\CreateStateRequestData;
use Stackra\Geography\Data\Resources\StateResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
