<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\Rollouts;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureRolloutRepositoryInterface;
use Academorix\FeatureFlags\Data\FeatureRolloutData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * `GET /api/v1/feature-flags/rollouts` — paginated list of tenant rollouts.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.rollouts.list')]
#[Get('/api/v1/feature-flags/rollouts')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.rollouts.manage')]
final class ListRollouts
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
     * @return LengthAwarePaginator<int, FeatureRolloutData>
     */
    public function __invoke(): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, \Academorix\FeatureFlags\Models\FeatureRollout> $rows */
        $rows = $this->repository->paginate();

        return $rows->through(fn ($row): FeatureRolloutData => FeatureRolloutData::fromModel($row));
    }
}
