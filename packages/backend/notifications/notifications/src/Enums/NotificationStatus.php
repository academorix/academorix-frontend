<?php

declare(strict_types=1);

namespace Stackra\Notifications\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Lifecycle state of a notification / delivery attempt.
 *
 * Both `Notification` (aggregate) and `NotificationDelivery` (per-channel
 * attempt) share this enum. The aggregate rolls up per-channel deliveries
 * into the highest terminal state reached by any of its deliveries.
 *
 * ## Cases
 *
 *  * {@see self::Queued}     — persisted; not yet handed to channel module.
 *  * {@see self::Sent}       — channel module accepted, provider message id captured.
 *  * {@see self::Delivered}  — provider webhook confirms endpoint delivery.
 *  * {@see self::Failed}     — retries exhausted or hard-failure signalled.
 *  * {@see self::Opened}     — tracking pixel / view event observed.
 *  * {@see self::Clicked}    — tracked link followed.
 *  * {@see self::Seen}       — recipient marked seen in the inbox surface.
 *  * {@see self::Archived}   — recipient archived from inbox.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotificationStatus: string
{
    use Enum;

    #[Label('Queued')]
    #[Description('Notification persisted; not yet handed off to a channel module.')]
    case Queued = 'queued';

    #[Label('Sent')]
    #[Description('Channel module accepted the payload and captured a provider message id.')]
    case Sent = 'sent';

    #[Label('Delivered')]
    #[Description('Provider webhook confirmed endpoint delivery.')]
    case Delivered = 'delivered';

    #[Label('Failed')]
    #[Description('Retries exhausted or a hard-failure signal was received. No further attempts.')]
    case Failed = 'failed';

    #[Label('Opened')]
    #[Description('Recipient opened the notification (tracking pixel or explicit view event).')]
    case Opened = 'opened';

    #[Label('Clicked')]
    #[Description('Recipient clicked a tracked link inside the notification body.')]
    case Clicked = 'clicked';

    #[Label('Seen')]
    #[Description('Recipient explicitly marked the notification seen in the inbox surface.')]
    case Seen = 'seen';

    #[Label('Archived')]
    #[Description('Recipient archived the notification from the inbox surface.')]
    case Archived = 'archived';
}
