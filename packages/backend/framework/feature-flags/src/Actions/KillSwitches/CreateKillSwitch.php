<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\KillSwitches;

use Stackra\Authorization\Attributes\RequireRole;
use Stackra\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureKillSwitchData;
use Stackra\FeatureFlags\Data\Requests\CreateKillSwitchRequestData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
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
        /** @var \Stackra\FeatureFlags\Models\FeatureKillSwitch $row */
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
