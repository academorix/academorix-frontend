<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when an artifact lookup returns nothing.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferArtifactNotFoundException extends AcademorixException
{
    public const CODE = 'TRANSFER_ARTIFACT_NOT_FOUND';

    public const TRANSLATION_KEY = 'transfer::errors.artifact_not_found';
}
