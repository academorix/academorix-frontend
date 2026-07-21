<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the entity doesn't support sample-data generation.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferEntityNotSampleableException extends Exception
{
    public const CODE = 'TRANSFER_ENTITY_NOT_SAMPLEABLE';

    public const TRANSLATION_KEY = 'transfer::errors.entity_not_sampleable';
}
