<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\Admin;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureRepositoryInterface;
use Academorix\FeatureFlags\Data\FeatureFlagData;
use Academorix\FeatureFlags\Exceptions\UnknownFeatureFlagException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;

/**
 * `GET /api/v1/feature-flags/{name}` — show a single registered flag.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.admin.show')]
#[Get('/api/v1/feature-flags/{name}')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.view')]
final class ShowFlag
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
     * @param  string  $name  Flag identifier from the URL.
     * @return FeatureFlagData
     *
     * @throws UnknownFeatureFlagException  When the flag is not registered.
     */
    public function __invoke(string $name): FeatureFlagData
    {
        $row = $this->repository->findByName($name);
        if ($row === null) {
            throw UnknownFeatureFlagException::named($name);
        }

        return FeatureFlagData::fromModel($row);
    }
}
