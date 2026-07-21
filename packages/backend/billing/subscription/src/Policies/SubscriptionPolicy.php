<?php

declare(strict_types=1);

namespace Stackra\Subscription\Policies;

use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Subscription}.
 *
 * Dual-guard. Owner + billing tenant roles see + manage their own
 * subscription; platform admins see everything cross-tenant.
 * Force-state overrides + enterprise invoice creation are locked
 * behind their own permissions.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionPolicy
{
    /**
     * Tenant members can list their own subscription; platform admins
     * see everything.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::SubscriptionView->value)
            || $user->can(SubscriptionPermission::PlatformSubscriptionsViewAny->value);
    }

    /**
     * Tenant members see their own tenant's subscription; platform
     * admins see any subscription.
     */
    public function view(Authenticatable $user, Subscription $subscription): bool
    {
        if ($user->can(SubscriptionPermission::PlatformSubscriptionsView->value)
            || $user->can(SubscriptionPermission::PlatformSubscriptionsViewAny->value)
        ) {
            return true;
        }

        if (! $user->can(SubscriptionPermission::SubscriptionView->value)) {
            return false;
        }

        return $this->belongsToCaller($user, $subscription);
    }

    /**
     * Owner + billing tenant roles read invoices.
     */
    public function viewInvoices(Authenticatable $user, Subscription $subscription): bool
    {
        return $user->can(SubscriptionPermission::SubscriptionViewInvoices->value)
            && $this->belongsToCaller($user, $subscription);
    }

    /**
     * Owner-only management (checkout / swap / cancel / resume /
     * portal).
     */
    public function manage(Authenticatable $user, Subscription $subscription): bool
    {
        return $user->can(SubscriptionPermission::SubscriptionManage->value)
            && $this->belongsToCaller($user, $subscription);
    }

    /**
     * Platform ops list every subscription cross-tenant.
     */
    public function platformViewAny(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlatformSubscriptionsViewAny->value);
    }

    /**
     * Platform ops view one subscription (cross-tenant).
     */
    public function platformView(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlatformSubscriptionsView->value);
    }

    /**
     * Sales + finance can create enterprise (offline PO) invoices.
     * Every use is audit-logged by the action.
     */
    public function platformEnterprise(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlatformSubscriptionsEnterprise->value);
    }

    /**
     * Super-admin can force a state override. Every use is
     * audit-logged with a mandatory reason.
     */
    public function platformForceState(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlatformSubscriptionsForceState->value);
    }

    /**
     * Compare the subscription's `tenant_id` to the caller's own.
     */
    private function belongsToCaller(Authenticatable $user, Subscription $subscription): bool
    {
        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $subscription->{SubscriptionInterface::ATTR_TENANT_ID};
    }
}
