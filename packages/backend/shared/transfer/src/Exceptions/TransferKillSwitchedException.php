<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when one of the `transfer.*` kill switches is off.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferKillSwitchedException extends Exception
{
    public const CODE = 'TRANSFER_KILL_SWITCHED';

    public const TRANSLATION_KEY = 'transfer::errors.kill_switched';
}
