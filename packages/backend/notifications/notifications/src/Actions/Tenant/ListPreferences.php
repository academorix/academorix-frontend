<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Repositories\NotificationPreferenceRepositoryInterface;
use Stackra\Notifications\Data\NotificationPreferenceData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\NotificationPreference;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/notification-preferences` — the caller's
 * preference grid.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.preferences.list')]
#[Get('/api/v1/tenant/notification-preferences')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle.preferences'])]
#[RequirePermission(NotificationsPermission::PreferencesView)]
final class ListPreferences
{
    use AsController;

    public function __construct(
        private readonly NotificationPreferenceRepositoryInterface $preferences,
        private readonly TenantContextInterface $tenantContext,
        private readonly AuthFactory $authFactory,
    ) {
    }

    /**
     * @return DataCollection<int, NotificationPreferenceData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();
        $userId = (string) $this->authFactory->guard('sanctum')->id();

        $rows = $this->preferences
            ->findByUser((string) $tenant->getKey(), $userId)
            ->map(static fn (NotificationPreference $p): NotificationPreferenceData => NotificationPreferenceData::fromModel($p));

        return new DataCollection(NotificationPreferenceData::class, $rows);
    }
}
