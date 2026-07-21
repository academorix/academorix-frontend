<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Stackra\Notifications\Data\NotificationData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\Notification;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/notifications` — the caller's inbox.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.list')]
#[Get('/api/v1/tenant/notifications')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NotificationsPermission::ViewAny)]
final class ListNotifications
{
    use AsController;

    public function __construct(
        private readonly NotificationRepositoryInterface $notifications,
        private readonly TenantContextInterface $tenantContext,
        private readonly AuthFactory $authFactory,
    ) {
    }

    /**
     * @return DataCollection<int, NotificationData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();
        $userId = (string) $this->authFactory->guard('sanctum')->id();

        $rows = $this->notifications
            ->paginateInboxFor((string) $tenant->getKey(), $userId)
            ->getCollection()
            ->map(static fn (Notification $n): NotificationData => NotificationData::fromModel($n));

        return new DataCollection(NotificationData::class, $rows);
    }
}
