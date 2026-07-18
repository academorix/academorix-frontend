<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a shard is not in a retryable state, or its parent
 * job is not in a retryable state.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferShardNotRetryableException extends AcademorixException
{
    public const CODE = 'TRANSFER_SHARD_NOT_RETRYABLE';

    public const TRANSLATION_KEY = 'transfer::errors.shard_not_retryable';
}
