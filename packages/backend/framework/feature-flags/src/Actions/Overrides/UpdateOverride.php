<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Overrides;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureOverrideData;
use Stackra\FeatureFlags\Data\Requests\UpdateOverrideRequestData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Put;
use Stackra\Routing\Attributes\WhereUlid;

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

        /** @var \Stackra\FeatureFlags\Models\FeatureOverride $row */
        $row = $this->repository->update($id, $patch);

        return FeatureOverrideData::fromModel($row);
    }
}
