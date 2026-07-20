<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\Overrides;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Academorix\FeatureFlags\Data\FeatureOverrideData;
use Academorix\FeatureFlags\Data\Requests\UpdateOverrideRequestData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Put;
use Academorix\Routing\Attributes\WhereUlid;

/**
 * `PUT /api/v1/feature-flags/overrides/{id}` — update an override.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.overrides.update')]
#[Put('/api/v1/feature-flags/overrides/{id}')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.overrides.manage')]
#[WhereUlid('id')]
final class UpdateOverride
{
    /**
     * @param  FeatureOverrideRepositoryInterface  $repository  Override persistence boundary.
     */
    public function __construct(
        private readonly FeatureOverrideRepositoryInterface $repository,
    ) {}

    /**
     * Handle the request.
     *
     * @param  string                     $id    Override id from the URL.
     * @param  UpdateOverrideRequestData  $data  Validated payload.
     * @return FeatureOverrideData
     */
    public function __invoke(string $id, UpdateOverrideRequestData $data): FeatureOverrideData
    {
        $patch = \array_filter(
            [
                FeatureOverrideInterface::ATTR_DECISION   => $data->decision,
                FeatureOverrideInterface::ATTR_REASON     => $data->reason,
                FeatureOverrideInterface::ATTR_EXPIRES_AT => $data->expiresAt,
            ],
            static fn ($v): bool => $v !== null,
        );

        /** @var \Academorix\FeatureFlags\Models\FeatureOverride $row */
        $row = $this->repository->update($id, $patch);

        return FeatureOverrideData::fromModel($row);
    }
}
