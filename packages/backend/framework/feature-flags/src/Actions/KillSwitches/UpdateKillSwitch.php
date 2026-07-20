<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\KillSwitches;

use Academorix\Authorization\Attributes\RequireRole;
use Academorix\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Academorix\FeatureFlags\Data\FeatureKillSwitchData;
use Academorix\FeatureFlags\Data\Requests\UpdateKillSwitchRequestData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Put;
use Academorix\Routing\Attributes\WhereUlid;

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

        /** @var \Academorix\FeatureFlags\Models\FeatureKillSwitch $row */
        $row = $this->repository->update($id, $patch);

        return FeatureKillSwitchData::fromModel($row);
    }
}
