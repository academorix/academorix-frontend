<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the requested format is not in the entity's
 * `#[Importable/Exportable].formats` list.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferFormatUnsupportedException extends AcademorixException
{
    public const CODE = 'TRANSFER_FORMAT_UNSUPPORTED';

    public const TRANSLATION_KEY = 'transfer::errors.format_unsupported';
}
