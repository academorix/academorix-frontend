<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the inline `/exports/stream` path would exceed the
 * entity's `syncThreshold`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferSyncThresholdExceededException extends AcademorixException
{
    public const CODE = 'TRANSFER_SYNC_THRESHOLD_EXCEEDED';

    public const TRANSLATION_KEY = 'transfer::errors.sync_threshold_exceeded';
}
