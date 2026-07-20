<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\Overrides;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Academorix\FeatureFlags\Data\FeatureOverrideData;
use Academorix\FeatureFlags\Data\Requests\CreateOverrideRequestData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Illuminate\Http\Response;

/**
 * `POST /api/v1/feature-flags/overrides` — create a per-subject override.
 *
 * Cross-tenant writes (payload `tenant_id` disagreeing with the
 * active tenant) return HTTP 403 with error code
 * `feature_flags.cross_tenant_write` (Requirement 19.3).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.overrides.create')]
#[Post('/api/v1/feature-flags/overrides')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.overrides.manage')]
final class CreateOverride
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
     * @param  CreateOverrideRequestData  $data  Validated payload.
     * @return Response
     */
    public function __invoke(CreateOverrideRequestData $data): Response
    {
        $currentTenantId = $this->resolveCurrentTenantId();
        if ($data->tenantId !== null && $data->tenantId !== $currentTenantId) {
            \abort(Response::HTTP_FORBIDDEN, 'feature_flags.cross_tenant_write');
        }

        /** @var \Academorix\FeatureFlags\Models\FeatureOverride $row */
        $row = $this->repository->create([
            FeatureOverrideInterface::ATTR_TENANT_ID   => $currentTenantId,
            FeatureOverrideInterface::ATTR_FLAG        => $data->flag,
            FeatureOverrideInterface::ATTR_SCOPE_LEVEL => $data->scopeLevel,
            FeatureOverrideInterface::ATTR_SCOPE_VALUE => $data->scopeValue,
            FeatureOverrideInterface::ATTR_DECISION    => $data->decision,
            FeatureOverrideInterface::ATTR_REASON      => $data->reason,
            FeatureOverrideInterface::ATTR_EXPIRES_AT  => $data->expiresAt,
        ]);

        return \response(FeatureOverrideData::fromModel($row)->toArray(), Response::HTTP_CREATED);
    }

    /**
     * Resolve the current tenant id from the tenancy helper.
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
