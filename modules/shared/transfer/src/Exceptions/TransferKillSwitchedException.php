<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when one of the `transfer.*` kill switches is off.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferKillSwitchedException extends AcademorixException
{
    public const CODE = 'TRANSFER_KILL_SWITCHED';

    public const TRANSLATION_KEY = 'transfer::errors.kill_switched';
}
