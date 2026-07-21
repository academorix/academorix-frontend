<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Stackra\Notifications\Push\Data\PushSubscriptionData;
use Stackra\Notifications\Push\Data\Requests\RegisterPushSubscriptionRequestData;
use Stackra\Notifications\Push\Enums\NotificationsPushPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * `POST /api/v1/tenant/notification-subscriptions` — register a push device.
 *
 * Tenant + application come from the resolved context; the user is the caller.
 * The observer's `creating` hook computes the fingerprint + validates the
 * token against the provider before persist. Duplicate submissions (same
 * user + application + fingerprint) update `last_seen_at` on the existing
 * row instead of inserting a new one.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.push.subscriptions.register')]
#[Post('/api/v1/tenant/notification-subscriptions')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(NotificationsPushPermission::SubscriptionsCreate)]
final class RegisterPushSubscription
{
    use AsController;

    public function __construct(
        private readonly PushSubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(
        RegisterPushSubscriptionRequestData $data,
        #[CurrentUser] Authenticatable $user,
    ): PushSubscriptionData {
        $tenant = $this->tenantContext->currentOrFail();
        $userId = \method_exists($user, 'getKey') ? (string) $user->getKey() : '';

        $applicationId = (string) $tenant->application_id;
        $fingerprint   = \hash('sha256', $data->deviceToken);

        // Duplicate handling — same fingerprint under the same (user, app)
        // refreshes last_seen_at + updates metadata instead of inserting a
        // second row.
        $existing = $this->subscriptions->findByFingerprint(
            $userId,
            $applicationId,
            $fingerprint,
        );

        if ($existing !== null) {
            $existing->forceFill([
                PushSubscriptionInterface::ATTR_DEVICE_NAME  => $data->deviceName ?? $existing->{PushSubscriptionInterface::ATTR_DEVICE_NAME},
                PushSubscriptionInterface::ATTR_APP_VERSION  => $data->appVersion ?? $existing->{PushSubscriptionInterface::ATTR_APP_VERSION},
                PushSubscriptionInterface::ATTR_OS_VERSION   => $data->osVersion ?? $existing->{PushSubscriptionInterface::ATTR_OS_VERSION},
                PushSubscriptionInterface::ATTR_LOCALE       => $data->locale ?? $existing->{PushSubscriptionInterface::ATTR_LOCALE},
                PushSubscriptionInterface::ATTR_TIMEZONE     => $data->timezone ?? $existing->{PushSubscriptionInterface::ATTR_TIMEZONE},
                PushSubscriptionInterface::ATTR_IS_ACTIVE    => true,
                PushSubscriptionInterface::ATTR_LAST_SEEN_AT => now(),
                PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT => null,
            ])->save();

            return PushSubscriptionData::fromModel($existing);
        }

        $subscription = $this->subscriptions->create([
            PushSubscriptionInterface::ATTR_TENANT_ID      => (string) $tenant->getKey(),
            PushSubscriptionInterface::ATTR_APPLICATION_ID => $applicationId,
            PushSubscriptionInterface::ATTR_USER_ID        => $userId,
            PushSubscriptionInterface::ATTR_PROVIDER       => $data->provider->value,
            PushSubscriptionInterface::ATTR_PLATFORM       => $data->platform->value,
            PushSubscriptionInterface::ATTR_DEVICE_TOKEN   => $data->deviceToken,
            PushSubscriptionInterface::ATTR_DEVICE_NAME    => $data->deviceName,
            PushSubscriptionInterface::ATTR_APP_VERSION    => $data->appVersion,
            PushSubscriptionInterface::ATTR_OS_VERSION     => $data->osVersion,
            PushSubscriptionInterface::ATTR_LOCALE         => $data->locale,
            PushSubscriptionInterface::ATTR_TIMEZONE       => $data->timezone,
            PushSubscriptionInterface::ATTR_IS_ACTIVE      => true,
        ]);

        return PushSubscriptionData::fromModel($subscription);
    }
}
