<?php

declare(strict_types=1);

namespace Stackra\Versioning\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Data\ApiVersionData;
use Stackra\Versioning\Enums\VersioningPermission;
use Stackra\Versioning\Exceptions\ApiVersionNotFoundException;
use Stackra\Versioning\Jobs\SunsetApiVersionJob;

/**
 * `POST /api/v1/platform/versioning/api-versions/{slug}/sunset` —
 * dispatch {@see SunsetApiVersionJob} to flip an ApiVersion from
 * `deprecated` to `sunset`.
 *
 * Dispatched asynchronously so downstream consumers that unregister
 * pinned webhook subscriptions in their own listeners don't block
 * the HTTP action.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.platform.api_versions.sunset')]
#[Post('/api/v1/platform/versioning/api-versions/{slug}/sunset')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(VersioningPermission::Manage)]
final class SunsetApiVersion
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

        SunsetApiVersionJob::dispatch((string) $version->getKey());

        return ApiVersionData::fromModel($version);
    }
}
