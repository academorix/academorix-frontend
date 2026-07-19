<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Tenant;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Data\ApiVersionData;
use Academorix\Versioning\Models\ApiVersion;
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
