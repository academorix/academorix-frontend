<?php

declare(strict_types=1);

namespace Academorix\Webhook\Enums;

use Academorix\Authorization\Contracts\PermissionEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Permissions the Webhook module contributes.
 *
 * Split across the two guards — platform admins view + manage every
 * subscription across every tenant; tenant admins manage their own
 * tenant's subscriptions.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum WebhookPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `webhook.subscription.view` — read-only access to every subscription
     * across every tenant. Granted to platform support staff.
     */
    #[Label('View Webhook Subscriptions (platform)')]
    #[Description('Read-only access to every webhook subscription across every tenant.')]
    case View = 'webhook.subscription.view';

    /**
     * `webhook.subscription.manage` — full lifecycle management of every
     * subscription across every tenant. Platform admins only.
     */
    #[Label('Manage Webhook Subscriptions (platform)')]
    #[Description('Full lifecycle management of every webhook subscription — pause / resume / disable across tenants.')]
    case Manage = 'webhook.subscription.manage';

    /**
     * `webhook.tenant.manage` — tenant admin manages their own tenant's
     * webhook subscriptions + deliveries + secret rotation.
     */
    #[Label('Manage Own Webhooks')]
    #[Description('Tenant admin manages their tenant\'s webhook subscriptions, tests, retries, and secret rotation.')]
    case ManageOwn = 'webhook.tenant.manage';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View, self::Manage => Guard::PlatformAdmin,
            self::ManageOwn          => Guard::Sanctum,
        };
    }
}
