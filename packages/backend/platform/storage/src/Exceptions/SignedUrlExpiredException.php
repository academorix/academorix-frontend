<?php

declare(strict_types=1);

namespace Academorix\Storage\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a redemption request lands on a signed URL past its
 * `expires_at`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class SignedUrlExpiredException extends AcademorixException
{
    public const CODE = 'storage.signed_url_expired';

    public const TRANSLATION_KEY = 'storage::errors.signed_url_expired';
}
