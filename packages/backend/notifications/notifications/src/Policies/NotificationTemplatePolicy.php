<?php

declare(strict_types=1);

namespace Stackra\Notifications\Policies;

use Stackra\Notifications\Contracts\Data\NotificationTemplateInterface;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\NotificationTemplate;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see NotificationTemplate}.
 *
 * Tenant admins manage their own tenant overrides; platform-owned
 * `is_system=true` rows are read-only outside the seeder unless the
 * caller is a super admin (short-circuited at higher levels via
 * `HasSystemFlag`).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationTemplatePolicy
{
    /**
     * `viewAny` — list templates.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NotificationsPermission::TemplatesViewAny->value)
            || $user->can(NotificationsPermission::PlatformTemplatesViewAny->value);
    }

    /**
     * `view` — read one template.
     */
    public function view(Authenticatable $user, NotificationTemplate $template): bool
    {
        return $this->viewAny($user);
    }

    /**
     * `create` — create a tenant override.
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(NotificationsPermission::TemplatesCreate->value);
    }

    /**
     * `update` — update a draft template.
     */
    public function update(Authenticatable $user, NotificationTemplate $template): bool
    {
        // Platform-owned system rows are read-only outside the seeder.
        if ((bool) $template->{NotificationTemplateInterface::ATTR_IS_SYSTEM}) {
            return false;
        }

        return $user->can(NotificationsPermission::TemplatesUpdate->value);
    }

    /**
     * `delete` — delete a template. Refused for is_system rows.
     */
    public function delete(Authenticatable $user, NotificationTemplate $template): bool
    {
        if ((bool) $template->{NotificationTemplateInterface::ATTR_IS_SYSTEM}) {
            return false;
        }

        return $user->can(NotificationsPermission::TemplatesDelete->value);
    }

    /**
     * `publish` — transition draft → published.
     */
    public function publish(Authenticatable $user, NotificationTemplate $template): bool
    {
        return $user->can(NotificationsPermission::TemplatesPublish->value);
    }

    /**
     * `test` — send a test render.
     */
    public function test(Authenticatable $user, NotificationTemplate $template): bool
    {
        return $user->can(NotificationsPermission::TemplatesTest->value);
    }
}
