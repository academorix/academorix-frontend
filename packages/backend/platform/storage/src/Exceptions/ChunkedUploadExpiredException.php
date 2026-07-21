<?php

declare(strict_types=1);

namespace Stackra\Storage\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised when a chunk / finalize request lands on a
 * {@see \Stackra\Storage\Models\ChunkedUpload} whose `expires_at`
 * has elapsed.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class ChunkedUploadExpiredException extends AcademorixException
{
    public const CODE = 'storage.chunked_upload_expired';

    public const TRANSLATION_KEY = 'storage::errors.chunked_upload_expired';
}
