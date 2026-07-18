<?php

declare(strict_types=1);

namespace Academorix\Notifications\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Delivery channels the notifications substrate knows about.
 *
 * Channel modules (`notifications-mail`, `notifications-sms`,
 * `notifications-push`, `notifications-in-app`) register their
 * concrete transports against these keys via the channel registry.
 *
 * ## Cases
 *
 *  * {@see self::InApp} — real-time in-app inbox (WebSocket / Reverb).
 *  * {@see self::Mail}  — email via SMTP / provider (Mailgun, Postmark).
 *  * {@see self::Push}  — mobile / web push (FCM, APNs, Web Push).
 *  * {@see self::Sms}   — text message via provider (Twilio, MessageBird).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotificationChannel: string
{
    use Enum;

    #[Label('In-app')]
    #[Description('Real-time in-app inbox delivery via the tenant broadcast channel.')]
    case InApp = 'in_app';

    #[Label('Mail')]
    #[Description('Email delivery via the configured provider (SMTP, Mailgun, Postmark).')]
    case Mail = 'mail';

    #[Label('Push')]
    #[Description('Mobile / web push notification via FCM, APNs, or Web Push.')]
    case Push = 'push';

    #[Label('SMS')]
    #[Description('Text message delivery via the configured SMS provider.')]
    case Sms = 'sms';
}
