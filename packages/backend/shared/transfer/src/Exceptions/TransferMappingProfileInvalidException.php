<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a mapping profile references an attribute that isn't
 * declared on the target entity.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferMappingProfileInvalidException extends AcademorixException
{
    public const CODE = 'TRANSFER_MAPPING_PROFILE_INVALID';

    public const TRANSLATION_KEY = 'transfer::errors.mapping_profile_invalid';
}
