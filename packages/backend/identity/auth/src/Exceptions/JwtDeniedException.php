<?php

declare(strict_types=1);

namespace Stackra\Auth\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * JWT was found in the deny-list — revoked before natural expiry.
 *
 * The verifier throws this AFTER signature + iss/aud/exp checks
 * pass but the `jti` claim is present in `auth_jwt_deny_lists`.
 * Client sees HTTP 403; the response envelope carries `JWT_DENIED`
 * so support tooling can distinguish "explicitly revoked" from
 * "cryptographically invalid".
 *
 * @category Auth
 *
 * @since    0.1.0
 */
final class JwtDeniedException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'JWT_DENIED';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'auth::errors.JWT_DENIED';
}
