<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised on an illegal state-machine transition caught by
 * `XferJobObserver`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferInvalidStateTransitionException extends StackraException
{
    public const CODE = 'TRANSFER_INVALID_STATE_TRANSITION';

    public const TRANSLATION_KEY = 'transfer::errors.invalid_state_transition';
}
