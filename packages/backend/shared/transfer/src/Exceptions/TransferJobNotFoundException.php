<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a lookup expects an xfer_job row but none is visible.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferJobNotFoundException extends StackraException
{
    public const CODE = 'TRANSFER_JOB_NOT_FOUND';

    public const TRANSLATION_KEY = 'transfer::errors.job_not_found';
}
