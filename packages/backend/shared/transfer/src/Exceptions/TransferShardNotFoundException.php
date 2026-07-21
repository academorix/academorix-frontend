<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a lookup expects an xfer_shards row but none is visible.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferShardNotFoundException extends StackraException
{
    public const CODE = 'TRANSFER_SHARD_NOT_FOUND';

    public const TRANSLATION_KEY = 'transfer::errors.shard_not_found';
}
