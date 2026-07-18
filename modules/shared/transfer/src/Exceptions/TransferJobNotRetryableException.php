<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when trying to retry a job that is not in a retryable state.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferJobNotRetryableException extends AcademorixException
{
    public const CODE = 'TRANSFER_JOB_NOT_RETRYABLE';

    public const TRANSLATION_KEY = 'transfer::errors.job_not_retryable';
}
