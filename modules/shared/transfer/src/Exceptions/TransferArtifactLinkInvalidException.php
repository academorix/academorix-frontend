<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the download signature is invalid or tampered.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferArtifactLinkInvalidException extends AcademorixException
{
    public const CODE = 'TRANSFER_ARTIFACT_LINK_INVALID';

    public const TRANSLATION_KEY = 'transfer::errors.artifact_link_invalid';
}
