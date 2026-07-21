<?php

declare(strict_types=1);

namespace Stackra\Versioning\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Data\ApiVersionData;
use Stackra\Versioning\Enums\ApiVersionStatus;
use Stackra\Versioning\Enums\VersioningPermission;
use Stackra\Versioning\Exceptions\ApiVersionNotFoundException;

/**
 * `POST /api/v1/platform/versioning/api-versions/{slug}/release` —
 * transition an ApiVersion from `draft` to `released`.
 *
 * The observer emits {@see \Stackra\Versioning\Events\ApiVersionReleased}
 * once the update commits.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.platform.api_versions.release')]
#[Post('/api/v1/platform/versioning/api-versions/{slug}/release')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(VersioningPermission::Manage)]
final class ReleaseApiVersion
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

        $version->update([
            ApiVersionInterface::ATTR_STATUS      => ApiVersionStatus::Released->value,
            ApiVersionInterface::ATTR_RELEASED_AT => $version->{ApiVersionInterface::ATTR_RELEASED_AT}
                ?? \now(),
        ]);

        return ApiVersionData::fromModel($version->refresh());
    }
}
