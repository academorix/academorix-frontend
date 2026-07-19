<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when Stripe / Paddle checkout session creation fails. HTTP
 * 502 bad gateway — retry with exponential backoff. Not user-facing;
 * exposed to ops via alerting.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class CheckoutProviderErrorException extends AcademorixException
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
