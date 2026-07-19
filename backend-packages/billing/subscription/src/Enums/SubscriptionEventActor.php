<?php

declare(strict_types=1);

namespace Academorix\Subscription\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Actor type responsible for a `SubscriptionEvent` row.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SubscriptionEventActor: string
{
    use Enum;

    /**
     * A tenant user performed the action.
     */
    #[Label('User')]
    #[Description('Tenant user performed the action (checkout / swap / cancel).')]
    case User = 'user';

    /**
     * The provider fired a webhook.
     */
    #[Label('Provider Webhook')]
    #[Description('Payment provider fired a webhook (Cashier translated it into an event).')]
    case ProviderWebhook = 'provider_webhook';

    /**
     * A scheduled job or observer fired the event.
     */
    #[Label('System')]
    #[Description('Scheduled job or observer fired the event.')]
    case System = 'system';

    /**
     * A platform admin took action.
     */
    #[Label('Platform Admin')]
    #[Description('Platform admin took action (enterprise invoice creation, force-state override).')]
    case PlatformAdmin = 'platform_admin';
}
