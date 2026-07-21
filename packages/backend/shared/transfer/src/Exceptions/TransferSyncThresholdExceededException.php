<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the inline `/exports/stream` path would exceed the
 * entity's `syncThreshold`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferSyncThresholdExceededException extends StackraException
{
    public const CODE = 'TRANSFER_SYNC_THRESHOLD_EXCEEDED';

    public const TRANSLATION_KEY = 'transfer::errors.sync_threshold_exceeded';
}
