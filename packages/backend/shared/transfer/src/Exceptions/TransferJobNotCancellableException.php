<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when trying to cancel a job that is already terminal.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferJobNotCancellableException extends StackraException
{
    public const CODE = 'TRANSFER_JOB_NOT_CANCELLABLE';

    public const TRANSLATION_KEY = 'transfer::errors.job_not_cancellable';
}
