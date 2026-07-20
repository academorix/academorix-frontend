<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised on an underlying filesystem disk error.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferStorageFailureException extends AcademorixException
{
    public const CODE = 'TRANSFER_STORAGE_FAILURE';

    public const TRANSLATION_KEY = 'transfer::errors.storage_failure';
}
