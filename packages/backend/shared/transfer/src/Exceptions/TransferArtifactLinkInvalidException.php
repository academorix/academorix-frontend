<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the download signature is invalid or tampered.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferArtifactLinkInvalidException extends StackraException
{
    public const CODE = 'TRANSFER_ARTIFACT_LINK_INVALID';

    public const TRANSLATION_KEY = 'transfer::errors.artifact_link_invalid';
}
