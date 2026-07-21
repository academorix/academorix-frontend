<?php

declare(strict_types=1);

namespace Stackra\Webhook\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a caller attempts to dispatch through a disabled or
 * paused subscription.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookSubscriptionDisabledException extends StackraException
{
    public const CODE = 'webhook.subscription_disabled';

    public const TRANSLATION_KEY = 'webhook::errors.subscription_disabled';
}
