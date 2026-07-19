<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Central;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Data\ApiVersionData;
use Academorix\Versioning\Models\ApiVersion;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/versions` — public catalog of released + deprecated
 * versions. Unauthenticated. Powers `docs.academorix.com` + third-party
 * integrations that need to know which versions are targetable.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.central.versions.list')]
#[Get('/api/versions')]
#[Middleware(['api'])]
final class ListVersions
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
