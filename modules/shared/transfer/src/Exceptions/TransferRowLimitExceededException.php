<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the file row count exceeds the entitlement.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferRowLimitExceededException extends AcademorixException
{
    public const CODE = 'TRANSFER_ROW_LIMIT_EXCEEDED';

    public const TRANSLATION_KEY = 'transfer::errors.row_limit_exceeded';
}
