<?php

declare(strict_types=1);

namespace Stackra\Versioning\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Data\ApiVersionData;
use Stackra\Versioning\Enums\VersioningPermission;
use Stackra\Versioning\Models\ApiVersion;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/versioning/api-versions` — every ApiVersion
 * including drafts + sunsets. Paginated at the repository layer.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.platform.api_versions.list')]
#[Get('/api/v1/platform/versioning/api-versions')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(VersioningPermission::View)]
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
        $rows = $this->versions->paginate()
            ->getCollection()
            ->map(static fn (ApiVersion $v): ApiVersionData => ApiVersionData::fromModel($v));

        return new DataCollection(ApiVersionData::class, $rows);
    }
}
