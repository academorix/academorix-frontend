<?php

declare(strict_types=1);

namespace Stackra\Webhook\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Lifecycle state of an individual webhook delivery attempt.
 *
 * ## Cases
 *
 *  * {@see self::Pending}         — row created; not yet dispatched.
 *  * {@see self::Dispatching}     — worker is actively sending the request.
 *  * {@see self::Delivered}       — receiver responded with a 2xx status.
 *  * {@see self::Failed}          — retryable failure; queued for the next attempt.
 *  * {@see self::FailedPermanent} — non-retryable OR the retry budget was exhausted.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum WebhookDeliveryStatus: string
{
    use Enum;

    #[Label('Pending')]
    #[Description('Delivery row created; the dispatcher has not picked it up yet.')]
    case Pending = 'pending';

    #[Label('Dispatching')]
    #[Description('Worker is actively sending the request to the destination.')]
    case Dispatching = 'dispatching';

    #[Label('Delivered')]
    #[Description('Receiver responded with a 2xx status code.')]
    case Delivered = 'delivered';

    #[Label('Failed')]
    #[Description('Retryable failure. Scheduled for the next attempt via the backoff strategy.')]
    case Failed = 'failed';

    #[Label('Failed Permanent')]
    #[Description('Non-retryable failure OR the retry budget is exhausted. No further attempts.')]
    case FailedPermanent = 'failed_permanent';
}
