<?php

declare(strict_types=1);

namespace Stackra\Auth\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised at boot when the HS256 shared secret is unset or too short.
 *
 * The signer refuses to serve when `SERVICE_JWT_SECRET` is missing
 * or under 32 bytes — HS256 with a short secret devolves to a
 * bruteforceable HMAC. Failing loud at boot beats leaking a weak
 * token at runtime.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
final class JwtSecretMisconfiguredException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'JWT_SECRET_MISCONFIGURED';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'auth::errors.JWT_SECRET_MISCONFIGURED';
}
