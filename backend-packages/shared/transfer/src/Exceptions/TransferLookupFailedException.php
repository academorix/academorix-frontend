<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Row-level exception — a `#[ImportField(lookup: ...)]` could not
 * resolve the referenced record.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferLookupFailedException extends AcademorixException
{
    public const CODE = 'TRANSFER_LOOKUP_FAILED';

    public const TRANSLATION_KEY = 'transfer::errors.lookup_failed';
}
