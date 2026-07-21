<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the tenant already has `max_concurrent_jobs` in flight.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferConcurrencyLimitExceededException extends Exception
{
    public const CODE = 'TRANSFER_CONCURRENCY_LIMIT_EXCEEDED';

    public const TRANSLATION_KEY = 'transfer::errors.concurrency_limit_exceeded';
}
