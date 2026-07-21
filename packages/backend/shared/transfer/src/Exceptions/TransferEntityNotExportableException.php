<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the entity doesn't support exports.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferEntityNotExportableException extends Exception
{
    public const CODE = 'TRANSFER_ENTITY_NOT_EXPORTABLE';

    public const TRANSLATION_KEY = 'transfer::errors.entity_not_exportable';
}
