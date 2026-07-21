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
use Stackra\Versioning\Data\Requests\CreateApiVersionRequestData;
use Stackra\Versioning\Enums\ApiVersionStatus;
use Stackra\Versioning\Enums\VersioningPermission;

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
