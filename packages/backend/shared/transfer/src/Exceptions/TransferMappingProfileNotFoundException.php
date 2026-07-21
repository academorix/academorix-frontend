<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a mapping-profile lookup returns nothing.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferMappingProfileNotFoundException extends Exception
{
    public const CODE = 'TRANSFER_MAPPING_PROFILE_NOT_FOUND';

    public const TRANSLATION_KEY = 'transfer::errors.mapping_profile_not_found';
}
