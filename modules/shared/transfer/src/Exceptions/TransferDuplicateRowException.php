<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Row-level exception — append-mode import found a row matching an
 * existing unique-by column.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferDuplicateRowException extends AcademorixException
{
    public const CODE = 'TRANSFER_DUPLICATE_ROW';

    public const TRANSLATION_KEY = 'transfer::errors.duplicate_row';
}
