<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the requested entity key is not in the EntityRegistry.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferEntityUnknownException extends StackraException
{
    public const CODE = 'TRANSFER_ENTITY_UNKNOWN';

    public const TRANSLATION_KEY = 'transfer::errors.entity_unknown';
}
