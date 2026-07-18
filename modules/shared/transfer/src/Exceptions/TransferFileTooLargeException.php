<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when an uploaded file exceeds the configured max size.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferFileTooLargeException extends AcademorixException
{
    public const CODE = 'TRANSFER_FILE_TOO_LARGE';

    public const TRANSLATION_KEY = 'transfer::errors.file_too_large';
}
