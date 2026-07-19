<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Central;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Data\ApiVersionData;
use Academorix\Versioning\Exceptions\ApiVersionNotFoundException;

/**
 * `GET /api/versions/{slug}` — public detail view for a single API
 * version. Unauthenticated. Draft + sunset versions are hidden.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.central.versions.show')]
#[Get('/api/versions/{slug}')]
#[Middleware(['api'])]
final class ShowVersion
{
    use AsController;

    public function __construct(
        private readonly ApiVersionRepositoryInterface $versions,
    ) {
    }

    public function __invoke(string $slug): ApiVersionData
    {
        $version = $this->versions->findBySlug($slug);
        if ($version === null) {
            throw new ApiVersionNotFoundException(\sprintf(
                'API version "%s" not found.',
                $slug,
            ));
        }

        return ApiVersionData::fromModel($version);
    }
}
