<?php

declare(strict_types=1);

namespace Academorix\Subscription\Policies;

use Academorix\Subscription\Contracts\Data\SubscriptionEventInterface;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Models\SubscriptionEvent;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see SubscriptionEvent}.
 *
 * Read-only surface — events are only ever created by observers or
 * webhook consumers. Tenant owners + billing role see their own
 * feed; platform billing team sees the cross-tenant SOX audit
 * trail.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionEventPolicy
{
    /**
     * Tenant owner + billing role list the tenant's event feed;
     * platform admins see everything cross-tenant.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::SubscriptionEventsViewAny->value)
            || $user->can(SubscriptionPermission::PlatformSubscriptionEventsViewAny->value);
    }

    /**
     * Read one row — same rules as `viewAny` plus a tenant check for
     * non-platform callers.
     */
    public function view(Authenticatable $user, SubscriptionEvent $event): bool
    {
        if ($user->can(SubscriptionPermission::PlatformSubscriptionEventsViewAny->value)) {
            return true;
        }

        if (! $user->can(SubscriptionPermission::SubscriptionEventsViewAny->value)) {
            return false;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $event->{SubscriptionEventInterface::ATTR_TENANT_ID};
    }

    /**
     * Platform billing team can list every tenant's events.
     */
    public function platformViewAny(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlatformSubscriptionEventsViewAny->value);
    }
}
