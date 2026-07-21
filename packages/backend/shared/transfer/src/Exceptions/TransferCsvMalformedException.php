<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a CSV file has non-UTF8 bytes, unmatched quoting, or
 * an unrecognised header row.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferCsvMalformedException extends Exception
{
    public const CODE = 'TRANSFER_CSV_MALFORMED';

    public const TRANSLATION_KEY = 'transfer::errors.csv_malformed';
}
