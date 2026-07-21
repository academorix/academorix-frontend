<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Data\NotificationPreferenceInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationPreferenceRepositoryInterface;
use Stackra\Notifications\Data\NotificationPreferenceData;
use Stackra\Notifications\Data\Requests\UpdatePreferencesRequestData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\NotificationPreference;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Support\Str;

/**
 * `PATCH /api/v1/tenant/notification-preferences` — upsert one
 * preference row.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.preferences.update')]
#[Patch('/api/v1/tenant/notification-preferences')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle.preferences'])]
#[RequirePermission(NotificationsPermission::PreferencesUpdate)]
final class UpdatePreferences
{
    use AsController;

    public function __construct(
        private readonly NotificationPreferenceRepositoryInterface $preferences,
        private readonly TenantContextInterface $tenantContext,
        private readonly AuthFactory $authFactory,
    ) {
    }

    public function __invoke(UpdatePreferencesRequestData $data): NotificationPreferenceData
    {
        $tenant = $this->tenantContext->currentOrFail();
        $userId = (string) $this->authFactory->guard('sanctum')->id();

        $existing = $this->preferences->findByTuple(
            (string) $tenant->getKey(),
            $userId,
            $data->categorySlug,
            $data->channel->value,
        );

        $payload = [
            NotificationPreferenceInterface::ATTR_ENABLED              => $data->enabled,
            NotificationPreferenceInterface::ATTR_DIGEST_MODE          => $data->digestMode?->value,
            NotificationPreferenceInterface::ATTR_QUIET_HOURS_START    => $data->quietHoursStart,
            NotificationPreferenceInterface::ATTR_QUIET_HOURS_END      => $data->quietHoursEnd,
            NotificationPreferenceInterface::ATTR_QUIET_HOURS_TIMEZONE => $data->quietHoursTimezone,
        ];

        if ($existing !== null) {
            $existing->fill($payload);
            $existing->save();

            return NotificationPreferenceData::fromModel($existing);
        }

        /** @var NotificationPreference $created */
        $created = NotificationPreference::query()->create(\array_merge($payload, [
            NotificationPreferenceInterface::ATTR_ID            => 'pref_' . Str::ulid()->toBase32(),
            NotificationPreferenceInterface::ATTR_TENANT_ID     => (string) $tenant->getKey(),
            NotificationPreferenceInterface::ATTR_USER_ID       => $userId,
            NotificationPreferenceInterface::ATTR_CATEGORY_SLUG => $data->categorySlug,
            NotificationPreferenceInterface::ATTR_CHANNEL       => $data->channel->value,
        ]));

        return NotificationPreferenceData::fromModel($created);
    }
}
