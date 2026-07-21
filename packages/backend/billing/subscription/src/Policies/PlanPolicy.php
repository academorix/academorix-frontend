<?php

declare(strict_types=1);

namespace Stackra\Subscription\Policies;

use Stackra\Subscription\Contracts\Data\PlanInterface;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Models\Plan;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Plan}.
 *
 * Dual-guard — platform admins can CRUD the catalogue; tenant users
 * only see public plans on their own Application.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class PlanPolicy
{
    /**
     * Tenant users can list plans on their own Application.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlansViewAny->value)
            || $user->can(SubscriptionPermission::PlatformPlansViewAny->value);
    }

    /**
     * Tenant users can view one public plan on their own Application.
     * Platform admins see everything.
     */
    public function view(Authenticatable $user, Plan $plan): bool
    {
        if ($user->can(SubscriptionPermission::PlatformPlansView->value)
            || $user->can(SubscriptionPermission::PlatformPlansViewAny->value)
        ) {
            return true;
        }

        if (! $user->can(SubscriptionPermission::PlansView->value)) {
            return false;
        }

        // Tenant users only see plans for their own Application.
        return $this->belongsToCallerApplication($user, $plan);
    }

    /**
     * Platform ops can list every plan cross-Application.
     */
    public function platformViewAny(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlatformPlansViewAny->value);
    }

    /**
     * Platform ops can view one plan (any Application).
     */
    public function platformView(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlatformPlansView->value);
    }

    /**
     * Platform ops can create new plans.
     */
    public function platformCreate(Authenticatable $user): bool
    {
        return $user->can(SubscriptionPermission::PlatformPlansCreate->value);
    }

    /**
     * Platform ops can update an existing plan. System plans are
     * still immutable outside the seed context; the observer catches
     * a system-plan mutation regardless.
     */
    public function platformUpdate(Authenticatable $user, Plan $plan): bool
    {
        if ($plan->{PlanInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }

        return $user->can(SubscriptionPermission::PlatformPlansUpdate->value);
    }

    /**
     * Platform super-admin archives a plan.
     */
    public function platformArchive(Authenticatable $user, Plan $plan): bool
    {
        if ($plan->{PlanInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }

        return $user->can(SubscriptionPermission::PlatformPlansArchive->value);
    }

    /**
     * Compare the plan's `application_id` to the caller's own
     * `application_id`. Falls back to `false` when the caller has no
     * application context resolved.
     */
    private function belongsToCallerApplication(Authenticatable $user, Plan $plan): bool
    {
        $callerApp = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('application_id')
            : null;

        return \is_string($callerApp)
            && $callerApp === $plan->{PlanInterface::ATTR_APPLICATION_ID};
    }
}
