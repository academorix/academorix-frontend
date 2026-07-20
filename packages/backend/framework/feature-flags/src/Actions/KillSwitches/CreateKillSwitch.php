<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\KillSwitches;

use Academorix\Authorization\Attributes\RequireRole;
use Academorix\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Academorix\FeatureFlags\Data\FeatureKillSwitchData;
use Academorix\FeatureFlags\Data\Requests\CreateKillSwitchRequestData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Illuminate\Http\Response;

/**
 * `POST /api/v1/feature-flags/kill-switches` — create a platform-scoped kill switch.
 *
 * Requires the `platform_admin` role. Returns `201` with the
 * persisted row on success.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.kill-switches.create')]
#[Post('/api/v1/feature-flags/kill-switches')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequireRole('platform_admin')]
final class CreateKillSwitch
{
    /**
     * @param  FeatureKillSwitchRepositoryInterface  $repository  Kill-switch persistence boundary.
     */
    public function __construct(
        private readonly FeatureKillSwitchRepositoryInterface $repository,
    ) {}

    /**
     * Handle the request.
     *
     * @param  CreateKillSwitchRequestData  $data  Validated payload.
     * @return Response
     */
    public function __invoke(CreateKillSwitchRequestData $data): Response
    {
        /** @var \Academorix\FeatureFlags\Models\FeatureKillSwitch $row */
        $row = $this->repository->create([
            FeatureKillSwitchInterface::ATTR_FLAG        => $data->flag,
            FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL => $data->scopeLevel,
            FeatureKillSwitchInterface::ATTR_SCOPE_VALUE => $data->scopeValue,
            FeatureKillSwitchInterface::ATTR_REASON      => $data->reason,
            FeatureKillSwitchInterface::ATTR_ENABLED_AT  => $data->enabledAt,
            FeatureKillSwitchInterface::ATTR_DISABLED_AT => $data->disabledAt,
        ]);

        return \response(FeatureKillSwitchData::fromModel($row)->toArray(), Response::HTTP_CREATED);
    }
}
