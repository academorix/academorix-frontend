<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised on an underlying filesystem disk error.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferStorageFailureException extends StackraException
{
    public const CODE = 'TRANSFER_STORAGE_FAILURE';

    public const TRANSLATION_KEY = 'transfer::errors.storage_failure';
}
