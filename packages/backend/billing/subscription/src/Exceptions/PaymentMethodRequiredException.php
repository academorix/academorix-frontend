<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a trial subscription attempts a paid action without a
 * payment method on file. HTTP 402 — the tenant must add a payment
 * method before proceeding.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class PaymentMethodRequiredException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.payment_method_required';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.payment_method_required';
}
