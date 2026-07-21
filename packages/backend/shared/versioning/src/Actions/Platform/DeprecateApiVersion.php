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
 * `POST /api/v1/platform/versioning/api-versions/{slug}/deprecate` —
 * transition an ApiVersion from `released` to `deprecated`. Schedules
 * the sunset date at `now() + versioning.sunset.default_notice_days`
 * unless `sunset_at` is already set.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.platform.api_versions.deprecate')]
#[Post('/api/v1/platform/versioning/api-versions/{slug}/deprecate')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(VersioningPermission::Manage)]
final class DeprecateApiVersion
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

        $noticeDays = (int) \config('versioning.sunset.default_notice_days', 180);

        $version->update([
            ApiVersionInterface::ATTR_STATUS        => ApiVersionStatus::Deprecated->value,
            ApiVersionInterface::ATTR_DEPRECATED_AT => $version->{ApiVersionInterface::ATTR_DEPRECATED_AT}
                ?? \now(),
            ApiVersionInterface::ATTR_SUNSET_AT => $version->{ApiVersionInterface::ATTR_SUNSET_AT}
                ?? \now()->addDays($noticeDays),
        ]);

        return ApiVersionData::fromModel($version->refresh());
    }
}
