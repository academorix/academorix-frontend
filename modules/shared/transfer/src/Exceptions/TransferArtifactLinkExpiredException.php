<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a signed download URL has expired.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferArtifactLinkExpiredException extends AcademorixException
{
    public const CODE = 'TRANSFER_ARTIFACT_LINK_EXPIRED';

    public const TRANSLATION_KEY = 'transfer::errors.artifact_link_expired';
}
