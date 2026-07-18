<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Signals that a Cashier webhook has already been processed — the
 * event's `provider_event_id` is present in `subscription_events`.
 * Returned as HTTP 200 to the provider so it stops retrying;
 * consumers treat this as a soft success.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class WebhookDuplicateException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.webhook_duplicate';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.webhook_duplicate';
}
