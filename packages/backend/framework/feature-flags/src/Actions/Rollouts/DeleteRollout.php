<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Rollouts;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureRolloutRepositoryInterface;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/feature-flags/rollouts/{id}` — soft-delete a rollout.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.rollouts.delete')]
#[Delete('/api/v1/feature-flags/rollouts/{id}')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.rollouts.manage')]
#[WhereUlid('id')]
final class DeleteRollout
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
     * @param  string  $id  Rollout id from the URL.
     * @return Response
     */
    public function __invoke(string $id): Response
    {
        $this->repository->delete($id);

        return \response()->noContent();
    }
}
