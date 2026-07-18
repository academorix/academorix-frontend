<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the entity doesn't support imports.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferEntityNotImportableException extends AcademorixException
{
    public const CODE = 'TRANSFER_ENTITY_NOT_IMPORTABLE';

    public const TRANSLATION_KEY = 'transfer::errors.entity_not_importable';
}
