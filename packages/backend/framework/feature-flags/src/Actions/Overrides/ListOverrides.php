<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Overrides;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureOverrideData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * `GET /api/v1/feature-flags/overrides` — paginated list of tenant overrides.
 *
 * Tenant-scoped — `BelongsToTenant` on the model constrains the read.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.overrides.list')]
#[Get('/api/v1/feature-flags/overrides')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.overrides.manage')]
final class ListOverrides
{
    /**
     * @param  FeatureOverrideRepositoryInterface  $repository  Override persistence boundary.
     */
    public function __construct(
        private readonly FeatureOverrideRepositoryInterface $repository,
    ) {}

    /**
     * Handle the request.
     *
     * @return LengthAwarePaginator<int, FeatureOverrideData>
     */
    public function __invoke(): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, \Stackra\FeatureFlags\Models\FeatureOverride> $rows */
        $rows = $this->repository->paginate();

        return $rows->through(fn ($row): FeatureOverrideData => FeatureOverrideData::fromModel($row));
    }
}
