<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the requested import mode is blocked by feature
 * toggle or entitlement.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferModeNotAllowedException extends Exception
{
    public const CODE = 'TRANSFER_MODE_NOT_ALLOWED';

    public const TRANSLATION_KEY = 'transfer::errors.mode_not_allowed';
}
