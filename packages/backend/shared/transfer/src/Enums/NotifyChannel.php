<?php

declare(strict_types=1);

namespace Stackra\Transfer\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Notification channels resolved onto `xfer_jobs.notify_channels`.
 *
 * ## Cases
 *
 *  * {@see self::Mail}      — transactional email.
 *  * {@see self::Broadcast} — Laravel Echo websocket channel.
 *  * {@see self::Database}  — persisted user notifications table.
 *  * {@see self::Push}      — mobile push (APNS / FCM).
 *  * {@see self::Sms}       — SMS (Twilio / Vonage).
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotifyChannel: string
{
    use Enum;

    /**
     * Mail — transactional email.
     */
    #[Label('Mail')]
    #[Description('Transactional email.')]
    case Mail = 'mail';

    /**
     * Broadcast — Laravel Echo websocket channel.
     */
    #[Label('Broadcast')]
    #[Description('Laravel Echo websocket channel.')]
    case Broadcast = 'broadcast';

    /**
     * Database — persisted user notifications table.
     */
    #[Label('Database')]
    #[Description('Persisted user notifications table.')]
    case Database = 'database';

    /**
     * Push — mobile push (APNS / FCM).
     */
    #[Label('Push')]
    #[Description('Mobile push (APNS / FCM).')]
    case Push = 'push';

    /**
     * SMS — SMS (Twilio / Vonage).
     */
    #[Label('SMS')]
    #[Description('SMS (Twilio / Vonage).')]
    case Sms = 'sms';
}
