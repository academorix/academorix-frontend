<?php

declare(strict_types=1);

namespace Academorix\Webhook\Policies;

use Academorix\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Models\WebhookDelivery;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see WebhookDelivery}.
 *
 * Read-only + retry. Delivery rows are append-only so no update /
 * delete abilities are exposed.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookDeliveryPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(WebhookPermission::View->value)
            || $user->can(WebhookPermission::Manage->value)
            || $user->can(WebhookPermission::ManageOwn->value);
    }

    public function view(Authenticatable $user, WebhookDelivery $delivery): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $delivery);
    }

    public function retry(Authenticatable $user, WebhookDelivery $delivery): bool
    {
        return $this->view($user, $delivery)
            && ($user->can(WebhookPermission::Manage->value) || $user->can(WebhookPermission::ManageOwn->value));
    }

    /**
     * Platform admins bypass; tenant admins must match tenant.
     */
    private function belongsToCaller(Authenticatable $user, WebhookDelivery $delivery): bool
    {
        if ($user->can(WebhookPermission::Manage->value) || $user->can(WebhookPermission::View->value)) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $delivery->{WebhookDeliveryInterface::ATTR_TENANT_ID};
    }
}
