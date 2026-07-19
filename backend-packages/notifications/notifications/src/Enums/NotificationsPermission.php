<?php

declare(strict_types=1);

namespace Academorix\Notifications\Enums;

use Academorix\Authorization\Contracts\PermissionEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Permissions the Notifications module contributes.
 *
 * Dual-guard — Sanctum permissions govern user-facing surfaces (inbox,
 * preferences, template management); platform-admin permissions gate
 * cross-tenant search + delivery diagnostics + retry.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotificationsPermission: string implements PermissionEnum
{
    use Enum;

    #[Label('View notification inbox')]
    #[Description('List the caller\'s notification inbox.')]
    case ViewAny = 'notifications.viewAny';

    #[Label('View single notification')]
    #[Description('View a single notification the caller owns.')]
    case View = 'notifications.view';

    #[Label('Mark notification seen')]
    #[Description('Mark one or many notifications as seen.')]
    case MarkSeen = 'notifications.markSeen';

    #[Label('Archive notification')]
    #[Description('Archive a notification from the inbox.')]
    case Archive = 'notifications.archive';

    #[Label('Delete notification')]
    #[Description('Hard-delete a notification. Reserved for support tooling.')]
    case Delete = 'notifications.delete';

    #[Label('View preferences')]
    #[Description('View the caller\'s notification preferences.')]
    case PreferencesView = 'notifications.preferences.view';

    #[Label('Update preferences')]
    #[Description('Update the caller\'s notification preferences.')]
    case PreferencesUpdate = 'notifications.preferences.update';

    #[Label('View any user\'s preferences (tenant admin)')]
    #[Description('Tenant admin can inspect any tenant user\'s preferences (support + DPO).')]
    case PreferencesAdminView = 'notifications.preferences.adminView';

    #[Label('List templates')]
    #[Description('List notification templates — platform defaults + tenant overrides.')]
    case TemplatesViewAny = 'notifications.templates.viewAny';

    #[Label('View template')]
    #[Description('View a single notification template + its rendered body.')]
    case TemplatesView = 'notifications.templates.view';

    #[Label('Create template')]
    #[Description('Create a new tenant-override template.')]
    case TemplatesCreate = 'notifications.templates.create';

    #[Label('Update template')]
    #[Description('Update a draft template.')]
    case TemplatesUpdate = 'notifications.templates.update';

    #[Label('Delete template')]
    #[Description('Delete a template. Refused on is_system rows and rows with live sends.')]
    case TemplatesDelete = 'notifications.templates.delete';

    #[Label('Publish template')]
    #[Description('Transition a draft template to published (SOC 2 CC8.1 change management gate).')]
    case TemplatesPublish = 'notifications.templates.publish';

    #[Label('Test template')]
    #[Description('Send a test render to a real recipient. Rate-limited.')]
    case TemplatesTest = 'notifications.templates.test';

    #[Label('Notifications admin dashboard')]
    #[Description('Access the tenant admin sends dashboard and tenant broadcast channel.')]
    case AdminView = 'notifications.admin.view';

    #[Label('Cross-tenant search (platform)')]
    #[Description('Cross-tenant notification search for support and abuse investigation.')]
    case PlatformViewAny = 'platform.notifications.viewAny';

    #[Label('Cross-tenant view (platform)')]
    #[Description('View a single Notification cross-tenant.')]
    case PlatformView = 'platform.notifications.view';

    #[Label('Cross-tenant retry (platform)')]
    #[Description('Retry a failed delivery from the cross-tenant surface. Rate-limited.')]
    case PlatformRetry = 'platform.notifications.retry';

    #[Label('Cross-tenant list templates (platform)')]
    #[Description('List every notification template across tenants for platform ops.')]
    case PlatformTemplatesViewAny = 'platform.notifications.templates.viewAny';

    #[Label('Cross-tenant list categories (platform)')]
    #[Description('List every notification category across tenants for platform ops.')]
    case PlatformCategoriesViewAny = 'platform.notifications.categories.viewAny';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::PlatformViewAny,
            self::PlatformView,
            self::PlatformRetry,
            self::PlatformTemplatesViewAny,
            self::PlatformCategoriesViewAny => Guard::PlatformAdmin,

            default => Guard::Sanctum,
        };
    }
}
