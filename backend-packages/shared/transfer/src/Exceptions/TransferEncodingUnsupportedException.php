<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the file charset is detected but not supported.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferEncodingUnsupportedException extends AcademorixException
{
    public const CODE = 'TRANSFER_ENCODING_UNSUPPORTED';

    public const TRANSLATION_KEY = 'transfer::errors.encoding_unsupported';
}
