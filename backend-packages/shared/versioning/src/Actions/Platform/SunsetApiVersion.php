<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Data\ApiVersionData;
use Academorix\Versioning\Enums\VersioningPermission;
use Academorix\Versioning\Exceptions\ApiVersionNotFoundException;
use Academorix\Versioning\Jobs\SunsetApiVersionJob;

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
