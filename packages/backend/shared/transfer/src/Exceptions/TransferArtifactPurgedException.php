<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the file backing an artifact has been purged from disk.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferArtifactPurgedException extends StackraException
{
    public const CODE = 'TRANSFER_ARTIFACT_PURGED';

    public const TRANSLATION_KEY = 'transfer::errors.artifact_purged';
}
