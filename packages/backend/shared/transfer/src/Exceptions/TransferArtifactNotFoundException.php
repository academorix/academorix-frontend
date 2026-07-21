<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when an artifact lookup returns nothing.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferArtifactNotFoundException extends Exception
{
    public const CODE = 'TRANSFER_ARTIFACT_NOT_FOUND';

    public const TRANSLATION_KEY = 'transfer::errors.artifact_not_found';
}
