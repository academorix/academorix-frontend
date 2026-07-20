<?php

declare(strict_types=1);

namespace Academorix\Webhook\Policies;

use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see WebhookSubscription}.
 *
 * Dual-guard — platform admins have full CRUD across every tenant;
 * tenant admins scope to their own tenant via `belongsToCaller()`.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookSubscriptionPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(WebhookPermission::View->value)
            || $user->can(WebhookPermission::Manage->value)
            || $user->can(WebhookPermission::ManageOwn->value);
    }

    public function view(Authenticatable $user, WebhookSubscription $subscription): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $subscription);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(WebhookPermission::Manage->value)
            || $user->can(WebhookPermission::ManageOwn->value);
    }

    public function update(Authenticatable $user, WebhookSubscription $subscription): bool
    {
        return $this->create($user) && $this->belongsToCaller($user, $subscription);
    }

    public function delete(Authenticatable $user, WebhookSubscription $subscription): bool
    {
        return $this->update($user, $subscription);
    }

    public function pause(Authenticatable $user, WebhookSubscription $subscription): bool
    {
        return $this->update($user, $subscription);
    }

    public function resume(Authenticatable $user, WebhookSubscription $subscription): bool
    {
        return $this->update($user, $subscription);
    }

    public function rotate(Authenticatable $user, WebhookSubscription $subscription): bool
    {
        return $this->update($user, $subscription);
    }

    public function test(Authenticatable $user, WebhookSubscription $subscription): bool
    {
        return $this->update($user, $subscription);
    }

    /**
     * Platform admins bypass; tenant admins must match tenant.
     */
    private function belongsToCaller(Authenticatable $user, WebhookSubscription $subscription): bool
    {
        if ($user->can(WebhookPermission::Manage->value) || $user->can(WebhookPermission::View->value)) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $subscription->{WebhookSubscriptionInterface::ATTR_TENANT_ID};
    }
}
