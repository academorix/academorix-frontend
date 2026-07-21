<?php

declare(strict_types=1);

namespace Stackra\Subscription\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a Cashier webhook signature fails verification. HTTP
 * 401 — possible replay / fraud attempt. Audit severity: alert.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class WebhookSignatureInvalidException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.webhook_signature_invalid';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.webhook_signature_invalid';
}
