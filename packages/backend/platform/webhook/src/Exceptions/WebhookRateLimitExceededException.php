<?php

declare(strict_types=1);

namespace Stackra\Webhook\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a subscription's `rate_limit_per_minute` is exceeded.
 * The dispatcher defers the delivery until the window clears.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookRateLimitExceededException extends StackraException
{
    public const CODE = 'webhook.rate_limit_exceeded';

    public const TRANSLATION_KEY = 'webhook::errors.rate_limit_exceeded';
}
