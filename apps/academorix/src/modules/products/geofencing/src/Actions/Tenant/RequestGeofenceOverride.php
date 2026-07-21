<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Academorix\Geofencing\Contracts\Services\GeofenceOverrideServiceInterface;
use Academorix\Geofencing\Data\Requests\RequestOverrideRequestData;
use Academorix\Geofencing\Enums\GeofencingPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * `POST /api/v1/geofence/overrides` — request an admin override on a
 * rejected check.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geofence.overrides.request')]
#[Post('/api/v1/geofence/overrides')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(GeofencingPermission::OverridesRequest)]
final class RequestGeofenceOverride
{
    use AsController;

    public function __construct(
        private readonly GeofenceOverrideServiceInterface $service,
    ) {
    }

    /**
     * @return array{approval_task_id: string}
     */
    public function __invoke(
        RequestOverrideRequestData $data,
        #[CurrentUser] Authenticatable $user,
    ): array {
        $userId = \method_exists($user, 'getKey') ? (string) $user->getKey() : '';

        $approvalTaskId = $this->service->requestOverride(
            originalCheckId: $data->originalCheckId,
            requesterUserId: $userId,
            reason: $data->reason,
        );

        return ['approval_task_id' => $approvalTaskId];
    }
}
