<?php

declare(strict_types=1);

namespace Academorix\Webhook\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Lifecycle state of a webhook subscription.
 *
 * ## Cases
 *
 *  * {@see self::Active}   — dispatching deliveries normally.
 *  * {@see self::Paused}   — manually paused by the tenant admin.
 *    New deliveries queue but do not dispatch until resumed.
 *  * {@see self::Disabled} — auto-disabled by the module (HTTP 410
 *    Gone, or `consecutive_failures` reached the threshold). Also
 *    reached via `api_version_sunset` on version deprecation.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum WebhookSubscriptionStatus: string
{
    use Enum;

    #[Label('Active')]
    #[Description('Subscription is dispatching deliveries normally.')]
    case Active = 'active';

    #[Label('Paused')]
    #[Description('Subscription is manually paused. Deliveries queue but do not dispatch.')]
    case Paused = 'paused';

    #[Label('Disabled')]
    #[Description('Subscription is auto-disabled after HTTP 410 or a consecutive-failure streak.')]
    case Disabled = 'disabled';
}
