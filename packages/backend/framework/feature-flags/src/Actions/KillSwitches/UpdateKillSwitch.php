<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\KillSwitches;

use Stackra\Authorization\Attributes\RequireRole;
use Stackra\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureKillSwitchData;
use Stackra\FeatureFlags\Data\Requests\UpdateKillSwitchRequestData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Put;
use Stackra\Routing\Attributes\WhereUlid;

/**
 * `PUT /api/v1/feature-flags/kill-switches/{id}` — update a kill switch.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.kill-switches.update')]
#[Put('/api/v1/feature-flags/kill-switches/{id}')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequireRole('platform_admin')]
#[WhereUlid('id')]
final class UpdateKillSwitch
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
     * @param  string                       $id    Kill-switch id from the URL.
     * @param  UpdateKillSwitchRequestData  $data  Validated payload.
     * @return FeatureKillSwitchData
     */
    public function __invoke(string $id, UpdateKillSwitchRequestData $data): FeatureKillSwitchData
    {
        $patch = \array_filter(
            [
                FeatureKillSwitchInterface::ATTR_ENABLED_AT  => $data->enabledAt,
                FeatureKillSwitchInterface::ATTR_DISABLED_AT => $data->disabledAt,
                FeatureKillSwitchInterface::ATTR_REASON      => $data->reason,
            ],
            static fn ($v): bool => $v !== null,
        );

        /** @var \Stackra\FeatureFlags\Models\FeatureKillSwitch $row */
        $row = $this->repository->update($id, $patch);

        return FeatureKillSwitchData::fromModel($row);
    }
}
