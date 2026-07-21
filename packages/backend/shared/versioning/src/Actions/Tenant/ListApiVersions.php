<?php

declare(strict_types=1);

namespace Stackra\Versioning\Actions\Tenant;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Data\ApiVersionData;
use Stackra\Versioning\Models\ApiVersion;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/versioning/api-versions` — tenant read-only
 * catalog of released + deprecated API versions.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.tenant.api_versions.list')]
#[Get('/api/v1/tenant/versioning/api-versions')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
final class ListApiVersions
{
    use AsController;

    public function __construct(
        private readonly ApiVersionRepositoryInterface $versions,
    ) {
    }

    /**
     * @return DataCollection<int, ApiVersionData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->versions->findActive()
            ->map(static fn (ApiVersion $v): ApiVersionData => ApiVersionData::fromModel($v));

        return new DataCollection(ApiVersionData::class, $rows);
    }
}
