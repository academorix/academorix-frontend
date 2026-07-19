<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the transfer queue kill switch is off.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferQueueDisabledException extends AcademorixException
{
    public const CODE = 'TRANSFER_QUEUE_DISABLED';

    public const TRANSLATION_KEY = 'transfer::errors.queue_disabled';
}
