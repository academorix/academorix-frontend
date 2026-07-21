<?php

declare(strict_types=1);

namespace Stackra\Versioning\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Data\ApiVersionData;
use Stackra\Versioning\Data\Requests\UpdateApiVersionRequestData;
use Stackra\Versioning\Enums\VersioningPermission;
use Stackra\Versioning\Exceptions\ApiVersionNotFoundException;

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
