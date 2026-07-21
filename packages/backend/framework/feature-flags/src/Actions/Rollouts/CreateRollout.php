<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Rollouts;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureRolloutRepositoryInterface;
use Stackra\FeatureFlags\Data\FeatureRolloutData;
use Stackra\FeatureFlags\Data\Requests\CreateRolloutRequestData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Illuminate\Http\Response;

/**
 * `POST /api/v1/feature-flags/rollouts` — create a percentage-based rollout.
 *
 * Cross-tenant writes return HTTP 403 (Requirement 19.3).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.rollouts.create')]
#[Post('/api/v1/feature-flags/rollouts')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.rollouts.manage')]
final class CreateRollout
{
    /**
     * @param  FeatureRolloutRepositoryInterface  $repository  Rollout persistence boundary.
     */
    public function __construct(
        private readonly FeatureRolloutRepositoryInterface $repository,
    ) {}

    /**
     * Handle the request.
     *
     * @param  CreateRolloutRequestData  $data  Validated payload.
     * @return Response
     */
    public function __invoke(CreateRolloutRequestData $data): Response
    {
        $currentTenantId = $this->resolveCurrentTenantId();
        if ($data->tenantId !== null && $data->tenantId !== $currentTenantId) {
            \abort(Response::HTTP_FORBIDDEN, 'feature_flags.cross_tenant_write');
        }

        /** @var \Stackra\FeatureFlags\Models\FeatureRollout $row */
        $row = $this->repository->create([
            FeatureRolloutInterface::ATTR_TENANT_ID   => $currentTenantId,
            FeatureRolloutInterface::ATTR_FLAG        => $data->flag,
            FeatureRolloutInterface::ATTR_SCOPE_LEVEL => $data->scopeLevel,
            FeatureRolloutInterface::ATTR_PERCENTAGE  => $data->percentage,
            FeatureRolloutInterface::ATTR_NOTES       => $data->notes,
            FeatureRolloutInterface::ATTR_STARTS_AT   => $data->startsAt,
            FeatureRolloutInterface::ATTR_ENDS_AT     => $data->endsAt,
        ]);

        return \response(FeatureRolloutData::fromModel($row)->toArray(), Response::HTTP_CREATED);
    }

    /**
     * Resolve the current tenant id.
     *
     * @return string
     */
    private function resolveCurrentTenantId(): string
    {
        if (\function_exists('tenant')) {
            $tenant = tenant();
            if ($tenant !== null) {
                return (string) $tenant->getKey();
            }
        }

        \abort(Response::HTTP_BAD_REQUEST, 'feature_flags.no_tenant_context');
    }
}
