<?php

declare(strict_types=1);

namespace Stackra\Webhook\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised when a subscription lookup expects a match but finds none.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookSubscriptionNotFoundException extends AcademorixException
{
    public const CODE = 'webhook.subscription_not_found';

    public const TRANSLATION_KEY = 'webhook::errors.subscription_not_found';
}
