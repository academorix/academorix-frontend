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
use Academorix\Versioning\Data\Requests\CreateApiVersionRequestData;
use Academorix\Versioning\Enums\ApiVersionStatus;
use Academorix\Versioning\Enums\VersioningPermission;

/**
 * `POST /api/v1/platform/versioning/api-versions` — create a new
 * ApiVersion in the `draft` state.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.platform.api_versions.create')]
#[Post('/api/v1/platform/versioning/api-versions')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(VersioningPermission::Manage)]
final class CreateApiVersion
{
    use AsController;

    public function __construct(
        private readonly ApiVersionRepositoryInterface $versions,
    ) {
    }

    public function __invoke(CreateApiVersionRequestData $data): ApiVersionData
    {
        $version = $this->versions->create([
            ApiVersionInterface::ATTR_SLUG         => $data->slug,
            ApiVersionInterface::ATTR_SCHEME       => $data->scheme->value,
            ApiVersionInterface::ATTR_SCHEME_VALUE => $data->schemeValue,
            ApiVersionInterface::ATTR_STATUS       => ApiVersionStatus::Draft->value,
            ApiVersionInterface::ATTR_DESCRIPTION  => $data->description,
            ApiVersionInterface::ATTR_IS_SYSTEM    => false,
        ]);

        return ApiVersionData::fromModel($version->refresh());
    }
}
