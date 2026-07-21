<?php

declare(strict_types=1);

namespace Stackra\Subscription\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when Stripe / Paddle checkout session creation fails. HTTP
 * 502 bad gateway — retry with exponential backoff. Not user-facing;
 * exposed to ops via alerting.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class CheckoutProviderErrorException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.checkout_provider_error';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.checkout_provider_error';
}
