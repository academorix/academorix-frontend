<?php

declare(strict_types=1);

namespace Stackra\Versioning\Actions\Central;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Data\ApiVersionData;
use Stackra\Versioning\Exceptions\ApiVersionNotFoundException;

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
