<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Admin;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureFlagData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;

/**
 * `GET /api/v1/feature-flags` — list every registered feature flag.
 *
 * Reads from the platform-scoped `feature_definitions` catalog.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.admin.list')]
#[Get('/api/v1/feature-flags')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.view')]
final class ListFlags
{
    /**
     * @param  FeatureRepositoryInterface  $repository  Catalog persistence boundary.
     */
    public function __construct(
        private readonly FeatureRepositoryInterface $repository,
    ) {}

    /**
     * Handle the request.
     *
     * @return array<int, FeatureFlagData>
     */
    public function __invoke(): array
    {
        return $this->repository
            ->allOrdered()
            ->map(fn ($row): FeatureFlagData => FeatureFlagData::fromModel($row))
            ->values()
            ->all();
    }
}
