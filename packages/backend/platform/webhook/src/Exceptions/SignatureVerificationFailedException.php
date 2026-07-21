<?php

declare(strict_types=1);

namespace Stackra\Webhook\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised by the inbound-webhook middleware when the request's HMAC
 * signature does not match either the current secret or the
 * rotation-grace previous secret.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class SignatureVerificationFailedException extends Exception
{
    public const CODE = 'webhook.signature_verification_failed';

    public const TRANSLATION_KEY = 'webhook::errors.signature_verification_failed';
}
