<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Data\ApiVersionData;
use Academorix\Versioning\Data\Requests\UpdateApiVersionRequestData;
use Academorix\Versioning\Enums\VersioningPermission;
use Academorix\Versioning\Exceptions\ApiVersionNotFoundException;

/**
 * `PATCH /api/v1/platform/versioning/api-versions/{slug}` — edit
 * descriptive metadata on an existing ApiVersion.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.platform.api_versions.update')]
#[Patch('/api/v1/platform/versioning/api-versions/{slug}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(VersioningPermission::Manage)]
final class UpdateApiVersion
{
    use AsController;

    public function __construct(
        private readonly ApiVersionRepositoryInterface $versions,
    ) {
    }

    public function __invoke(string $slug, UpdateApiVersionRequestData $data): ApiVersionData
    {
        $version = $this->versions->findBySlug($slug);
        if ($version === null) {
            throw new ApiVersionNotFoundException(\sprintf(
                'API version "%s" not found.',
                $slug,
            ));
        }

        $updates = [];
        if ($data->description !== null) {
            $updates[ApiVersionInterface::ATTR_DESCRIPTION] = $data->description;
        }
        if ($data->schemeValue !== null) {
            $updates[ApiVersionInterface::ATTR_SCHEME_VALUE] = $data->schemeValue;
        }

        if ($updates !== []) {
            $version->update($updates);
        }

        return ApiVersionData::fromModel($version->refresh());
    }
}
