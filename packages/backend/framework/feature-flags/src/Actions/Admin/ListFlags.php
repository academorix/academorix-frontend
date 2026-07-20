<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\Admin;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureRepositoryInterface;
use Academorix\FeatureFlags\Data\FeatureFlagData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;

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
