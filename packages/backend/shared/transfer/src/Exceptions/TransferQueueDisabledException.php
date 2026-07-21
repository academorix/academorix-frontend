<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the transfer queue kill switch is off.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferQueueDisabledException extends StackraException
{
    public const CODE = 'TRANSFER_QUEUE_DISABLED';

    public const TRANSLATION_KEY = 'transfer::errors.queue_disabled';
}
