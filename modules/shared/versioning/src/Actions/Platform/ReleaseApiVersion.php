<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Data\ApiVersionData;
use Academorix\Versioning\Enums\ApiVersionStatus;
use Academorix\Versioning\Enums\VersioningPermission;
use Academorix\Versioning\Exceptions\ApiVersionNotFoundException;

/**
 * `POST /api/v1/platform/versioning/api-versions/{slug}/release` —
 * transition an ApiVersion from `draft` to `released`.
 *
 * The observer emits {@see \Academorix\Versioning\Events\ApiVersionReleased}
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
