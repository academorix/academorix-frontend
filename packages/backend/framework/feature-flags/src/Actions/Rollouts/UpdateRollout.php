<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Rollouts;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureRolloutRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureRolloutData;
use Stackra\FeatureFlags\Data\Requests\UpdateRolloutRequestData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Put;
use Stackra\Routing\Attributes\WhereUlid;

/**
 * `PUT /api/v1/feature-flags/rollouts/{id}` — update a rollout.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.rollouts.update')]
#[Put('/api/v1/feature-flags/rollouts/{id}')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.rollouts.manage')]
#[WhereUlid('id')]
final class UpdateRollout
{
    /**
     * @param  FeatureRolloutRepositoryInterface  $repository  Rollout persistence boundary.
     */
    public function __construct(
        private readonly FeatureRolloutRepositoryInterface $repository,
    ) {}

    /**
     * Handle the request.
     *
     * @param  string                    $id    Rollout id from the URL.
     * @param  UpdateRolloutRequestData  $data  Validated payload.
     * @return FeatureRolloutData
     */
    public function __invoke(string $id, UpdateRolloutRequestData $data): FeatureRolloutData
    {
        $patch = \array_filter(
            [
                FeatureRolloutInterface::ATTR_PERCENTAGE => $data->percentage,
                FeatureRolloutInterface::ATTR_NOTES      => $data->notes,
                FeatureRolloutInterface::ATTR_STARTS_AT  => $data->startsAt,
                FeatureRolloutInterface::ATTR_ENDS_AT    => $data->endsAt,
            ],
            static fn ($v): bool => $v !== null,
        );

        /** @var \Stackra\FeatureFlags\Models\FeatureRollout $row */
        $row = $this->repository->update($id, $patch);

        return FeatureRolloutData::fromModel($row);
    }
}
