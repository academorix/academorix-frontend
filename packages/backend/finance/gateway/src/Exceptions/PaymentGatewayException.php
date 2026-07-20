<?php

declare(strict_types=1);

namespace Academorix\Gateway\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Base exception for provider-side errors that don't map onto one of the
 * specific gateway exceptions.
 *
 * Consumers catch this broad type in the outermost handler; the specific
 * subclasses (WebhookSignatureInvalidException, PaymentMethodExpiredException,
 * ...) are caught closer to the call site when the recovery differs per case.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
class PaymentGatewayException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'PAYMENT_GATEWAY_ERROR';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'gateway::errors.PAYMENT_GATEWAY_ERROR';
}
