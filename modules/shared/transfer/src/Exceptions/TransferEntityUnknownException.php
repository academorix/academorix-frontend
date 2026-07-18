<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the requested entity key is not in the EntityRegistry.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferEntityUnknownException extends AcademorixException
{
    public const CODE = 'TRANSFER_ENTITY_UNKNOWN';

    public const TRANSLATION_KEY = 'transfer::errors.entity_unknown';
}
