<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when an uploaded file exceeds the configured max size.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferFileTooLargeException extends Exception
{
    public const CODE = 'TRANSFER_FILE_TOO_LARGE';

    public const TRANSLATION_KEY = 'transfer::errors.file_too_large';
}
