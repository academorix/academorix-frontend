<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Rollouts;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureRolloutRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureRolloutData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
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
        /** @var LengthAwarePaginator<int, \Stackra\FeatureFlags\Models\FeatureRollout> $rows */
        $rows = $this->repository->paginate();

        return $rows->through(fn ($row): FeatureRolloutData => FeatureRolloutData::fromModel($row));
    }
}
