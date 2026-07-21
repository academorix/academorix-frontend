<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Admin;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureFlagData;
use Stackra\FeatureFlags\Exceptions\UnknownFeatureFlagException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;

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
